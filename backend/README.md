## Change recipient address

To change the recipient address, you can change the `[args]` on `src/index.js` file to destination address that you want.

```javascript
class MintERC20Route extends AdvanceRoute {
  execute = (request) => {
    this.parse_request(request);
    console.log("minting erc20 token.....");
    const call = encodeFunctionData({
      abi: erc20Abi,
      functionName: "mintFifty",
      args: [this.msg_sender], // your choice of address
    });
    return new Voucher(erc20_contract_address, hexToBytes(call));
  };
}
```
