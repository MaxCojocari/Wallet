import { useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import Wallet from "./contracts/Wallet.json";
import walletAddress from "./contracts/Wallet-contract-address.json";
import './App.css';


function App() {

  const [message1, setMessage1] = useState("")
  const [message2, setMessage2] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isAlertVisible, setIsAllertVisible] = useState(false)

  const [balanceETH, setBalanceETH] = useState(0)

  const [balanceOMG, setBalanceOMG] = useState("-")

  // Requests access to the user's Meta Mask Account
  // https://metamask.io/
  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }


  function getWalletContract() {

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wallet = new ethers.Contract(
      walletAddress.Wallet,
      Wallet.abi,
      signer
    );

    return wallet
  }

  const wallet = getWalletContract()

  async function connectToWallet() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount()
      const currentBalanceETH = await wallet.getBalance("ETH")/(10 ** 18)
      setBalanceETH(currentBalanceETH)
      try {
        const currentBalanceOMG = await wallet.getBalance("OMG")/(10 ** 18)
        setBalanceOMG(currentBalanceOMG)
      } catch (error) {
        console.clear()
        setBalanceOMG("-")
      }
    } 
  }
  
  async function sendETH() {
    // If MetaMask exists
    if (!message1) return

    if (typeof window.ethereum !== "undefined") {
      await requestAccount()
      //const wallet = await getWalletContract()
      const value = BigNumber.from(message1)

      if (!message2) {
        const txData = {
          value: value,
          //value: ethers.utils.formatEther(value),
          to: wallet.address
        }
  
        const tx = await wallet.signer.sendTransaction(txData)
        await tx.wait()
      } else {
        await wallet.send("ETH", message2, value)
      }

      const currentBalanceETH = await wallet.getBalance("ETH")/(10 ** 18)
      
      
      setMessage1("")
      setMessage2("")
      setBalanceETH(currentBalanceETH)
    }
  }

  async function sendOMG() {
    if (!message1) return
    
    // If MetaMask exists
    if (typeof window.ethereum !== "undefined") {
      await requestAccount()
      const value = BigNumber.from(message1)

      await wallet.send("OMG", message2, value)

      const currentBalanceOMG = await wallet.getBalance("OMG")/(10 ** 18)
      
      setMessage1("")
      setMessage2("")
      setBalanceOMG(currentBalanceOMG)
    }
  }
  
  async function importToken() {
    if (!message2) return

    if (typeof window.ethereum !== "undefined") {
      
      try {
        const currentBalanceOMG = await wallet.getBalance("OMG")/(10 ** 18)

        setMessage2("")
        setIsAllertVisible(true)
        
        setTimeout(() => {
          setIsAllertVisible(false);
        }, 3000);
        
        setBalanceOMG(currentBalanceOMG)
        
        
      } catch (error) {
        console.clear()

        await requestAccount()
        await wallet.importToken(message2)
  
        setMessage2("")
        setBalanceOMG(0)
      }
      
    }
  }

  async function buyToken() {
    if (!message1) return

    try {
      if (typeof window.ethereum !== "undefined") {
        await requestAccount()
        const value = BigNumber.from(message1)
        
        await wallet.buy(message2, value)
  
        const currentBalanceETH = await wallet.getBalance("ETH")/(10 ** 18)
        const currentBalanceOMG = await wallet.getBalance("OMG")/(10 ** 18)
        
        setBalanceETH(currentBalanceETH)
        setBalanceOMG(currentBalanceOMG)
        setMessage1("")
        setMessage2("")
      }
    } catch (error) {
      setErrorMessage(error.reason)
      setMessage1("")
      setMessage2("")
    }
  }

  async function sellToken() {
    if (!message1) return

    if (typeof window.ethereum !== "undefined") {
      await requestAccount()
      const value = BigNumber.from(message1)
      
      await wallet.sellTokens(message2, value)

      const currentBalanceETH = await wallet.getBalance("ETH")/(10 ** 18)
      const currentBalanceOMG = await wallet.getBalance("OMG")/(10 ** 18)
      
      setBalanceETH(currentBalanceETH)
      setBalanceOMG(currentBalanceOMG)
      setMessage1("")
      setMessage2("")
    }
  }

  async function withdrawETH() {
    if (!message1) return

    if (typeof window.ethereum !== "undefined") {
      await requestAccount()
      const value = BigNumber.from(message1)
      
      await wallet.withdraw(value)

      const currentBalanceETH = await wallet.getBalance("ETH")/(10 ** 18)
      
      setBalanceETH(currentBalanceETH)
      setMessage1("")
    }
  }

  return (
    <div className="App">
      <div className="App-header">
        <text>ETH: {balanceETH}</text>
        <text>OMG: {balanceOMG}</text>
        {/* BUTTONS - Fetch and Set */}
        <div className="custom-buttons">
          <button 
            onClick={connectToWallet}
            style={{backgroundColor: "rgb(0, 102, 255)"}}>Connect
          </button>
          <button 
            onClick={sendETH}
            style={{backgroundColor: "rgb(255, 102, 0)"}}>Send ETH
          </button>
          <button 
            onClick={sendOMG}
            style={{backgroundColor: "rgb(190, 196, 4)"}}>Send OMG
          </button>
          <button 
            onClick={importToken}
            style={{backgroundColor: "rgb(28, 128, 5)"}}>Import OMG token
          </button>
          <button 
            onClick={buyToken}
            style={{backgroundColor: "rgb(151, 38, 237)"}}>Buy OMG Tokens
          </button>
          <button 
            onClick={sellToken}
            style={{backgroundColor: "rgb(230, 21, 62)"}}>Sell OMG Tokens
          </button>
          <button 
            onClick={withdrawETH}
            style={{backgroundColor: "rgb(6, 136, 191)"}}>Withdraw ETH
          </button>
        </div>
        
        {/* INPUT TEXT - String  */}
        <input
          onChange={(e) => setMessage1(e.target.value)}
          value={message1}
          placeholder="Amount tokens to send"
          />

        <input
          onChange={(e) => setMessage2(e.target.value)}
          value={message2}
          placeholder="Enter address"
        />

        {/* Current Value stored on Blockchain */}
        {/*<h2 className="greeting">Greeting: {currentGreeting}</h2>*/}
        {isAlertVisible && <text>The OMG token is allready imported!</text>}
        {errorMessage && <text>{errorMessage}</text>}
      </div>
    </div>
  );

}


export default App;
