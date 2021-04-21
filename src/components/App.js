import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Meme from '../abis/Meme.json'

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      buffer: null,
      memeHash: 'QmcdDq6h9TeGVF8TTpcA7Q7wMZbZWQZ7F9PetxLNbnE3jP'
    };
  }

  captureFile = (event) => {
    event.preventDefault()
    console.log ('file captured...')
    // process file for ipfs
    const file = event.target.files[0]
    const reader = window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer.from(reader.result) })
    }
  }

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    const networkId = await web3.eth.net.getId()
    const networkData = Meme.networks[networkId]
    if(networkData) {
      const contract = web3.eth.Contract(Meme.abi, networkData.address)
      this.setState({ contract })
      const memeHash = await contract.methods.get().call()
      this.setState({memeHash})
    } else {
      window.alert('Smart contract not deployed to detected network.')
    }
  }



  captureFile = (event) => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

onSubmit = async (event) => {
      event.preventDefault()
      console.log("Submitting the form...")
      await ipfs.add(this.state.buffer, (error, result) => {
           console.log('IPFS result', result)
           const memeHash = result[0].hash
           this.setState({ memeHash })
            if(error) {
               console.error(error)
               return
            }
            this.state.contract.methods.set(memeHash).send({ from: this.state.account }).then((r) => {
              this.setState({memeHash})
            })
       })
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://gateway.ipfs.io/ipfs/${this.state.memeHash}`}
            download > click here to download the uploaded image
          </a>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <a
                  rel="noopener noreferrer"
                >
                  <img src={`https://gateway.ipfs.io/ipfs/QmSVPV4ccnNiz65PmPZt76pfpGZza6mK7Czh5sxyFzGxoV`}/>
                </a>
                <p>&nbsp;</p>
                <h2>New image</h2>

                  <form onSubmit={this.onSubmit} >
                  <input type='file' onChange={this.captureFile}/>
                  <input type='submit'/>

                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
