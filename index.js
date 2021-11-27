const { ChainId, Token, Fetcher, CELO, Route, Trade, TokenAmount,  TradeType, Percent } = require('@ubeswap/sdk')
const { ethers, Wallet } = require("ethers")
const provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org')
// const provider = new ethers.providers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org')

const chainId = ChainId.MAINNET;
// const chainId = ChainId.ALFAJORES
console.log('chainId is...', chainId)

// Wallet connection details
const Seed =  '' // enter your wallet 12 word seed phrase
const to =  '0xc8739959E413365255d82d86e6db157768B6DEAD';  // '0x8bf0AfCa4e54D8F4d46FA3F734Aaf1c1A10c6AD0'// should be a checksummed recipient address // enter your wallet address where to send the bought tokens

const wallet = ethers.Wallet.fromMnemonic(Seed)
// const wallet = new Wallet(Seed)
console.log("wallet====>>>", wallet)
const account = wallet.connect(provider)

const addresses = { 
    UbeswapFactory: '0x62d5b84bE28a183aBB507E125B384122D2C25fAE', 
    ubeswapRouter: '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121',
    tokenAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a'
    // tokenAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' 
  }


async function getSwapdata() {
  
  const UBE = await Fetcher.fetchTokenData(chainId, addresses.tokenAddress, provider)
  console.log("....Ubeswap", UBE )
  
  // note that you may want/need to handle this async code differently,
  // for example if top-level await is not an option
  const pair = await Fetcher.fetchPairData(UBE, CELO[UBE.chainId], provider)
  console.log("<<===pair===>", pair)
  console.log("pair_celo_ube volumeToken0 = ", pair.reserve0.toSignificant(6));
  console.log("pair_celo_ube volumeToken1 = ", pair.reserve1.toSignificant(6));
  const route = new Route([pair], CELO[UBE.chainId])
  console.log("<<<===Route====>>>", route)

  const amountIn = "1000000000000000000"; // 1 CELO convert amountIn.toString()

  const trade = new Trade(route, new TokenAmount(CELO[UBE.chainId], amountIn), TradeType.EXACT_INPUT)

  const slippageTolerance = new Percent("50", "10000") // 0%
  const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw  // needs to be converted to e.g. hex
  const amountOutMinHex = ethers.BigNumber.from(amountOutMin.toString()).toHexString()
  
  const path = [CELO[UBE.chainId].address, UBE.address] //  path with 2 addresses
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
  const value = trade.inputAmount.raw // needs to be converted to e.g. hex
  const inputAmountHex = ethers.BigNumber.from(value.toString()).toHexString()

  const gasLimit  = await provider.estimateGas()
  const gasNeeded1 = (0.15*10**6)*2
  
  console.log('<<======>>', { path, to, deadline, value, inputAmountHex })

  const router = new ethers.Contract(
    addresses.ubeswapRouter, 
    [
      'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external virtual override ensure(deadline) returns (uint[] memory amounts)'
    ],
    account)

  const tx = {
    from: to,
    to: addresses.ubeswapRouter, 
    gas: gasNeeded1,
    data: router.swapExactTokensForTokens(
    amountOutMinHex,
    0,
    path,
    to,
    deadline,
    { value: inputAmountHex, gasPrice: ethers.utils.parseUnits('20', 'gwei'), gasLimit: gasLimit })
  }
  
    console.log("<====transaction====>",tx)


}

getSwapdata()