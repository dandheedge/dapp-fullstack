import { encodeFunctionData, getAddress, hexToBytes, hexToString } from "viem";
import { AdvanceRoute, Router } from "cartesi-router";
import { Wallet, Notice, Output, Error_out, Voucher } from "cartesi-wallet";
import smart_contract from "./smart_contract.json" assert { type: "json" };
import erc20Abi from "./erc20.json" assert { type: "json" };
import rocketNFT from "./rocket.json" assert { type: "json" };
const erc20_contract_address = getAddress(
  "0xE3A7cb0220FA40f9AD9fAcC9FB13A51bC77BD4Fa" // Sepolia network
);
const rocket_NFT = getAddress("0x5FbDB2315678afecb367f032d93F642f64180aa3"); // localhost
let rollup_address = "";
const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;

class MintERC20Route extends AdvanceRoute {
  execute = (request) => {
    this.parse_request(request);
    console.log("minting erc20 token.....");
    const call = encodeFunctionData({
      abi: erc20Abi,
      functionName: "mintFifty",
      args: [this.msg_sender],
    });
    return new Voucher(erc20_contract_address, hexToBytes(call));
  };
}

class MintRocketRoute extends AdvanceRoute {
  execute = (request) => {
    this.parse_request(request);
    console.log("minting rocket token.....");
    const call = encodeFunctionData({
      abi: rocketNFT,
      functionName: "safeMint",
      args: [this.request_args.to],
    });
    return new Voucher(rocket_NFT, hexToBytes(call));
  };
}

let Network = "localhost";
Network = process.env.Network;
console.info("rollup server url is ", rollup_server, Network);
if (Network === undefined) {
  Network = "localhost";
}
const wallet = new Wallet(new Map());
const router = new Router(wallet);
router.addRoute("mint_erc", new MintERC20Route(wallet));
router.addRoute("mint_rocket", new MintRocketRoute(wallet));

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};
var finish = { status: "accept" };

const send_request = async (output) => {
  if (output instanceof Output) {
    let endpoint;
    console.log("type of output", output.type);

    if (output.type == "notice") {
      endpoint = "/notice";
    } else if (output.type == "voucher") {
      endpoint = "/voucher";
    } else {
      endpoint = "/report";
    }

    console.log(`sending request ${typeof output}`);
    const response = await fetch(rollup_server + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(output),
    });
    console.debug(
      `received ${output.payload} status ${response.status} body ${response.body}`
    );
  } else {
    output.forEach((value) => {
      send_request(value);
    });
  }
};

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));
  try {
    const payload = data.payload;
    const msg_sender = data.metadata.msg_sender;
    console.log("msg sender is", msg_sender.toLowerCase());
    const payloadStr = hexToString(payload);

    // deposit ether
    if (
      msg_sender.toLowerCase() ===
      smart_contract.EtherPortalAddress.toLowerCase()
    ) {
      try {
        return router.process("ether_deposit", payload);
      } catch (e) {
        return new Error_out(`failed to process ether deposit ${payload} ${e}`);
      }
    }

    // relay address
    if (
      msg_sender.toLowerCase() === smart_contract.DAppRelayAddress.toLowerCase()
    ) {
      try {
        rollup_address = payload;
        router.set_rollup_address(rollup_address, "ether_withdraw");
        router.set_rollup_address(rollup_address, "erc20_withdraw");
        router.set_rollup_address(rollup_address, "erc721_withdraw");

        console.log("Setting DApp address");
        return new Notice(
          `DApp address set up successfully to ${rollup_address}`
        );
      } catch (error) {
        return new Error_out(`failed to relay DApp Address ${payload} ${e}`);
      }
    }

    // deposit erc20
    if (
      msg_sender.toLowerCase() ===
      smart_contract.Erc20PortalAddress.toLowerCase()
    ) {
      try {
        return router.process("erc20_deposit", payload);
      } catch (e) {
        return new Error_out(`failed ot process ERC20Deposit ${payload} ${e}`);
      }
    }

    // deposit erc721
    if (
      msg_sender.toLowerCase() ===
      smart_contract.Erc721PortalAddress.toLowerCase()
    ) {
      try {
        return router.process("erc721_deposit", payload);
      } catch (e) {
        return new Error_out(`failed ot process ERC20Deposit ${payload} ${e}`);
      }
    }

    //{"method": "ether_withdraw","args": {"amount": 2000000000000000000}}
    //{"method": "ether_withdraw","args": {"amount": 2000000000000000000}}
    //'{"method": "mint_rocket", "args": {"to": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"}}';
    try {
      const jsonpayload = JSON.parse(payloadStr);
      console.log("payload is: ", jsonpayload);
      return router.process(jsonpayload.method, data);
    } catch (e) {
      return new Error_out(`failed to process command ${payloadStr} ${e}`);
    }
  } catch (e) {
    console.error(e);
    return new Error_out(`failed to process advance_request ${e}`);
  }
}

async function handle_inspect(data) {
  console.debug(`received inspect request data${data}`);
  try {
    const url = hexToString(data.payload).split("/");
    console.log("url is ", url);
    return router.process(url[0], url[1]);
  } catch (e) {
    const error_msg = `failed to process inspect request ${e}`;
    console.debug(error_msg);
    return new Error_out(error_msg);
  }
}

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();

      var typeq = rollup_req.request_type;
      var handler;
      if (typeq === "inspect_state") {
        handler = handlers.inspect_state;
      } else {
        handler = handlers.advance_state;
      }
      var output = await handler(rollup_req.data);
      finish.status = "accept";
      if (output instanceof Error_out) {
        finish.status = "reject";
      }
      console.log(output);
      console.log(output instanceof Output);
      await send_request(output);
    }
  }
})();
