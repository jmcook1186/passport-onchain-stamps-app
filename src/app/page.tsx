'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { BigNumber } from "@ethersproject/bignumber";
import { ChakraProvider, Flex, Heading, Button, Alert, AlertTitle, AlertDescription } from '@chakra-ui/react'
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

export default function Passport() {
  // here we deal with any local state we need to manage
  const [address, setAddress] = useState<string>('')
  const [resolverContract, setResolverContract] = useState<ethers.Contract>()
  const [EasContract, setEasContract] = useState<ethers.Contract>()
  const [connected, setConnected] = useState<boolean>()
  const [hasStamps, setHasStamps] = useState<boolean>(false)
  const [stamps, setStamps] = useState<Array<string>>([])

  useEffect(() => {
    checkConnection()
    async function checkConnection() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        // if the user is connected, set their account
        if (accounts && accounts[0]) {
          setAddress(accounts[0].address)
          setConnected(true)
          setResolverContract(new ethers.Contract(resolverContractAddress, resolverAbi, provider))
          setEasContract(new ethers.Contract(EasContractAddress, EasAbi, provider))
          // The address from the above deployment example
        }
      } catch (err) {
        console.log('not connected...')
      }
    }
  }, [])

  async function connect() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(accounts[0])
      setConnected(true)
      setResolverContract(new ethers.Contract(resolverContractAddress, resolverAbi, provider))
      setEasContract(new ethers.Contract(EasContractAddress, EasAbi, provider))
    } catch (err) {
      console.log('error connecting...')
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
    const issuanceDates = decodedData.find((data) => data.name === "issuanceDates")?.value.value as BigNumber[];
    const expirationDates = decodedData.find((data) => data.name === "expirationDates")?.value.value as BigNumber[];
    const hashes = decodedData.find((data) => data.name === "hashes")?.value.value as string[];

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

  async function getStamps(onChainProviderInfo: DecodedProviderInfo[]) {
    const stamps: Array<string> = []
    onChainProviderInfo.forEach(toArray)
    function toArray(item: any, index: number) {
      stamps.push(item.providerName)
    }
    setStamps(stamps)
    console.log("stamps", stamps)
    setHasStamps(stamps.includes('twitterAccountAgeGte#180'))
  }

  async function getStampInfo() {
    const uuid = await getUuid()
    const att = await getAttestation(uuid)
    const onChainProviderInfo = await decodeAttestation(att)
    const myStamps = await getStamps(onChainProviderInfo)
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
      <ChakraProvider >
        <Flex minWidth='max-content' alignItems='right' gap='2' justifyContent='right'>
          <Button colorScheme='teal' variant='outline' onClick={connect}>Connect Wallet</Button>
          <Button colorScheme='teal' variant='outline' onClick={getStampInfo}>Query Passport</Button>
        </Flex>
        <br />
        <br />
        <Heading as='h1' size='4xl' noOfLines={2}>Onchain Passport app</Heading>
        <Heading as='h1' size='xl' noOfLines={2}>Make sure your wallet is connected to Base Goerli!</Heading>
        <br />
        <br />
        {connected && hasStamps && <Heading as='h1' size='xl'>"well done you have the right onchain stamps!" </Heading>}
        <br />
        <br />
        {connected && !hasStamps && <Heading as='h1' size='xl'>"you don't have the right onchain stamps!" </Heading>}
      </ChakraProvider >
    </div >
  )
}
