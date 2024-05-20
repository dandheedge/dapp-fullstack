const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("KNIToken", (m) => {
  const awt = m.contract("KumoNoIto", []);
  return { awt };
});
