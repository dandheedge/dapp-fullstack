const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("AwesomeToken", (m) => {
  const awt = m.contract("AwesomeToken", []);
  return { awt };
});
