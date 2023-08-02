'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { BigNumber } from "@ethersproject/bignumber";
import { ChakraProvider, Flex, Heading, Button } from '@chakra-ui/react'
import { TabLayout } from './tab-contents'
import { Attestation, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { resolverAbi, EasAbi } from "./abis";
import { PROVIDER_ID, providerBitMapInfo, DecodedProviderInfo } from "./providerInfo";

const resolverContractAddress = "0xc0fF118369894100b652b5Bb8dF5A2C3d7b2E343";
const EasContractAddress = "0xAcfE09Fd03f7812F022FBf636700AdEA18Fd2A7A"

declare global {
  interface Window {
    ethereum: any
  }
}

interface Stamp {
  id: number
  stamp: string
}

export default function Passport() {
  // here we deal with any local state we need to manage
  const [address, setAddress] = useState<string>('')
  const [provider, setProvider] = useState<ethers.BrowserProvider>()
  const [resolverContract, setResolverContract] = useState<ethers.Contract>()
  const [EasContract, setEasContract] = useState<ethers.Contract>()
  const [connected, setConnected] = useState<boolean>()
  const [hasStamps, setHasStamps] = useState<boolean>(false)
  const [stamps, setStamps] = useState<Array<Stamp>>([])

  useEffect(() => {
    checkConnection()
    async function checkConnection() {
      try {
        const newProvider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await newProvider.listAccounts()
        setProvider(newProvider)
        // if the user is connected, set their account
        if (accounts && accounts[0]) {
          setAddress(accounts[0].address)
          setConnected(true)
          await loadContracts()
          // The address from the above deployment example
        }
      } catch (err) {
        console.log('not connected...')
      }
    }
  }, [])

  async function connect() {
    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      setConnected(true)
      setProvider(newProvider)
      await loadContracts()
    } catch (err) {
      console.log('error connecting...')
    }
  }

  function loadContracts() {
    if (connected) {
      setResolverContract(new ethers.Contract(resolverContractAddress, resolverAbi, provider))
      setEasContract(new ethers.Contract(EasContractAddress, EasAbi, provider))
    } else {
      console.log("connect your wallet!")
    }
  }

  async function getUuid() {
    if (connected) {
      // TODO this is a test address known to have onchain stamps! swap for var address in final app.
      if (resolverContract !== undefined) {
        const uuid = await resolverContract.passports("0xC79ABB54e4824Cdb65C71f2eeb2D7f2db5dA1fB8")
        console.log(uuid)
        if (uuid == "0x0000000000000000000000000000000000000000000000000000000000000000") {
          (console.log("no passport data on chain!"))
        } else {
          return uuid
        }
      } else {
        console.log("error loading Resolver contract")
      }
    }
  }

  async function getAttestation(uuid: string) {
    if (connected) {
      if (EasContract !== undefined) {
        const attestation = await EasContract.getAttestation(uuid)
        return attestation
      } else {
        console.log("error loading EAS contract")
      }
    }
  }

  async function decodeAttestation(attestation: Attestation) {

    const schemaEncoder = new SchemaEncoder(
      "uint256[] providers,bytes32[] hashes,uint64[] issuanceDates,uint64[] expirationDates,uint16 providerMapVersion"
    );
    const decodedData = schemaEncoder.decodeData(attestation.data)
    console.log("decoded data!\n", decodedData)

    const providers = decodedData.find((data) => data.name === "providers")?.value.value as BigNumber[];

    type DecodedProviderInfo = {
      providerName: PROVIDER_ID;
      providerNumber: number;
    };

    const onChainProviderInfo: DecodedProviderInfo[] = providerBitMapInfo
      .map((info) => {
        const providerMask = BigNumber.from(1).shl(info.bit);
        const currentProvidersBitmap = providers[info.index];
        if (currentProvidersBitmap && !providerMask.and(currentProvidersBitmap).eq(BigNumber.from(0))) {
          return {
            providerName: info.name,
            providerNumber: info.index * 256 + info.bit,
          };
        }
      })
      .filter((provider): provider is DecodedProviderInfo => provider !== undefined);

    return onChainProviderInfo
  }

  function getStamps(onChainProviderInfo: DecodedProviderInfo[]) {
    const stamps: Array<Stamp> = []
    onChainProviderInfo.forEach(toArray)
    function toArray(item: any, index: number) {
      let s = { id: index, stamp: item.providerName }
      stamps.push(s)
    }
    setStamps(stamps)
    console.log("stamps", stamps)
    setHasStamps(stamps.length > 0)
  }

  async function queryPassport() {
    try {
      const uuid = await getUuid()
      const att = await getAttestation(uuid)
      const onChainProviderInfo = await decodeAttestation(att)
      getStamps(onChainProviderInfo)
    } catch {
      console.log("error decoding data - you might not have any data onchain!")
    }
  }

  const styles = {
    main: {
      width: '900px',
      margin: '0 auto',
      paddingTop: 90
    }
  }

  return (
    /* this is the UI for the app */
    <div style={styles.main}>
      <ChakraProvider>
        <Flex minWidth='max-content' alignItems='right' gap='2' justifyContent='right'>
          <Button colorScheme='teal' variant='outline' onClick={connect}>Connect Wallet</Button>
          <Button colorScheme='teal' variant='outline' onClick={queryPassport}>Query Passport</Button>
        </Flex>
        <br />
        <br />
        <Heading as='h1' size='4xl' noOfLines={2}>Welcome to the onchain Stamps!</Heading>
        <br />
        <TabLayout hasStamps={hasStamps} stamps={stamps} />
      </ChakraProvider >
    </div >
  )
}

