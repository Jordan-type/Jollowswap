// const provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org')
// const provider = new ethers.providers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org')

// router addresses
const addressesMain = {
    ubeswapFactory: "0x62d5b84bE28a183aBB507E125B384122D2C25fAE",
    ubeswapRouter: "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121",
    ubeswapMoolaRouter: "0x7D28570135A2B1930F331c507F65039D4937f66c",
    celoTokenAddress: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    cusdTokenAddress: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  };

const addressesTest = {
    cusdTokenAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    celoTokenAddress: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    TokenAddress1: '0x4C61Ccad9C113719359599c7FC27b3662938fC3A',
    TokenAddress2: '0x763A798C41b66A9164443E0707364813B6A424A4',
    ubeswapRouter: "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121", 
}

module.exports = { addressesTest, addressesMain }