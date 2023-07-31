'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { BigNumber } from "@ethersproject/bignumber";
import { ChakraProvider, Flex, Heading, Button, Alert, AlertTitle, AlertDescription } from '@chakra-ui/react'
import { Attestation, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { decode } from 'punycode';

const APIKEY = process.env.NEXT_PUBLIC_GC_API_KEY
const SCORERID = process.env.NEXT_PUBLIC_GC_SCORER_ID

// endpoint for submitting passport
const SUBMIT_PASSPORT_URI = 'https://api.scorer.gitcoin.co/registry/submit-passport'
// endpoint for getting the signing message
const SIGNING_MESSAGE_URI = 'https://api.scorer.gitcoin.co/registry/signing-message'
// score needed to see hidden message
const thresholdNumber = 20
const headers = APIKEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': APIKEY
}) : undefined
declare global {
  interface Window {
    ethereum: any
  }
}
const resolverContractAddress = "0xc0fF118369894100b652b5Bb8dF5A2C3d7b2E343";
const EasContractAddress = "0xAcfE09Fd03f7812F022FBf636700AdEA18Fd2A7A"
const resolverAbi = [{ "inputs": [{ "internalType": "contract IEAS", "name": "eas", "type": "address" }, { "internalType": "contract GitcoinAttester", "name": "gitcoinAttester", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "AccessDenied", "type": "error" }, { "inputs": [], "name": "InsufficientValue", "type": "error" }, { "inputs": [], "name": "InvalidEAS", "type": "error" }, { "inputs": [], "name": "NotPayable", "type": "error" }, { "inputs": [{ "components": [{ "internalType": "bytes32", "name": "uid", "type": "bytes32" }, { "internalType": "bytes32", "name": "schema", "type": "bytes32" }, { "internalType": "uint64", "name": "time", "type": "uint64" }, { "internalType": "uint64", "name": "expirationTime", "type": "uint64" }, { "internalType": "uint64", "name": "revocationTime", "type": "uint64" }, { "internalType": "bytes32", "name": "refUID", "type": "bytes32" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "address", "name": "attester", "type": "address" }, { "internalType": "bool", "name": "revocable", "type": "bool" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct Attestation", "name": "attestation", "type": "tuple" }], "name": "attest", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "isPayable", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "pure", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "bytes32", "name": "uid", "type": "bytes32" }, { "internalType": "bytes32", "name": "schema", "type": "bytes32" }, { "internalType": "uint64", "name": "time", "type": "uint64" }, { "internalType": "uint64", "name": "expirationTime", "type": "uint64" }, { "internalType": "uint64", "name": "revocationTime", "type": "uint64" }, { "internalType": "bytes32", "name": "refUID", "type": "bytes32" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "address", "name": "attester", "type": "address" }, { "internalType": "bool", "name": "revocable", "type": "bool" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct Attestation[]", "name": "attestations", "type": "tuple[]" }, { "internalType": "uint256[]", "name": "values", "type": "uint256[]" }], "name": "multiAttest", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "bytes32", "name": "uid", "type": "bytes32" }, { "internalType": "bytes32", "name": "schema", "type": "bytes32" }, { "internalType": "uint64", "name": "time", "type": "uint64" }, { "internalType": "uint64", "name": "expirationTime", "type": "uint64" }, { "internalType": "uint64", "name": "revocationTime", "type": "uint64" }, { "internalType": "bytes32", "name": "refUID", "type": "bytes32" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "address", "name": "attester", "type": "address" }, { "internalType": "bool", "name": "revocable", "type": "bool" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct Attestation[]", "name": "attestations", "type": "tuple[]" }, { "internalType": "uint256[]", "name": "values", "type": "uint256[]" }], "name": "multiRevoke", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "passports", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "bytes32", "name": "uid", "type": "bytes32" }, { "internalType": "bytes32", "name": "schema", "type": "bytes32" }, { "internalType": "uint64", "name": "time", "type": "uint64" }, { "internalType": "uint64", "name": "expirationTime", "type": "uint64" }, { "internalType": "uint64", "name": "revocationTime", "type": "uint64" }, { "internalType": "bytes32", "name": "refUID", "type": "bytes32" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "address", "name": "attester", "type": "address" }, { "internalType": "bool", "name": "revocable", "type": "bool" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct Attestation", "name": "attestation", "type": "tuple" }], "name": "revoke", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "payable", "type": "function" }]
const EasAbi = [
  {
    "inputs": [
      {
        "internalType": "contract ISchemaRegistry",
        "name": "registry",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AccessDenied",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyRevoked",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyRevokedOffchain",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyTimestamped",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientValue",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAttestation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAttestations",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidExpirationTime",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidLength",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidOffset",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidRegistry",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidRevocation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidRevocations",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSchema",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidVerifier",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Irrevocable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotPayable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongSchema",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "attester",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "uid",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "schema",
        "type": "bytes32"
      }
    ],
    "name": "Attested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "attester",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "uid",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "schema",
        "type": "bytes32"
      }
    ],
    "name": "Revoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "revoker",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "data",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "timestamp",
        "type": "uint64"
      }
    ],
    "name": "RevokedOffchain",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "data",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "timestamp",
        "type": "uint64"
      }
    ],
    "name": "Timestamped",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint64",
                "name": "expirationTime",
                "type": "uint64"
              },
              {
                "internalType": "bool",
                "name": "revocable",
                "type": "bool"
              },
              {
                "internalType": "bytes32",
                "name": "refUID",
                "type": "bytes32"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct AttestationRequestData",
            "name": "data",
            "type": "tuple"
          }
        ],
        "internalType": "struct AttestationRequest",
        "name": "request",
        "type": "tuple"
      }
    ],
    "name": "attest",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint64",
                "name": "expirationTime",
                "type": "uint64"
              },
              {
                "internalType": "bool",
                "name": "revocable",
                "type": "bool"
              },
              {
                "internalType": "bytes32",
                "name": "refUID",
                "type": "bytes32"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct AttestationRequestData",
            "name": "data",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint8",
                "name": "v",
                "type": "uint8"
              },
              {
                "internalType": "bytes32",
                "name": "r",
                "type": "bytes32"
              },
              {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
              }
            ],
            "internalType": "struct EIP712Signature",
            "name": "signature",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "attester",
            "type": "address"
          }
        ],
        "internalType": "struct DelegatedAttestationRequest",
        "name": "delegatedRequest",
        "type": "tuple"
      }
    ],
    "name": "attestByDelegation",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAttestTypeHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "uid",
        "type": "bytes32"
      }
    ],
    "name": "getAttestation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "uid",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "time",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "expirationTime",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "revocationTime",
            "type": "uint64"
          },
          {
            "internalType": "bytes32",
            "name": "refUID",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "attester",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "revocable",
            "type": "bool"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct Attestation",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDomainSeparator",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getName",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "getNonce",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "revoker",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "data",
        "type": "bytes32"
      }
    ],
    "name": "getRevokeOffchain",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRevokeTypeHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSchemaRegistry",
    "outputs": [
      {
        "internalType": "contract ISchemaRegistry",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "data",
        "type": "bytes32"
      }
    ],
    "name": "getTimestamp",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "uid",
        "type": "bytes32"
      }
    ],
    "name": "isAttestationValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint64",
                "name": "expirationTime",
                "type": "uint64"
              },
              {
                "internalType": "bool",
                "name": "revocable",
                "type": "bool"
              },
              {
                "internalType": "bytes32",
                "name": "refUID",
                "type": "bytes32"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct AttestationRequestData[]",
            "name": "data",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct MultiAttestationRequest[]",
        "name": "multiRequests",
        "type": "tuple[]"
      }
    ],
    "name": "multiAttest",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "recipient",
                "type": "address"
              },
              {
                "internalType": "uint64",
                "name": "expirationTime",
                "type": "uint64"
              },
              {
                "internalType": "bool",
                "name": "revocable",
                "type": "bool"
              },
              {
                "internalType": "bytes32",
                "name": "refUID",
                "type": "bytes32"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct AttestationRequestData[]",
            "name": "data",
            "type": "tuple[]"
          },
          {
            "components": [
              {
                "internalType": "uint8",
                "name": "v",
                "type": "uint8"
              },
              {
                "internalType": "bytes32",
                "name": "r",
                "type": "bytes32"
              },
              {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
              }
            ],
            "internalType": "struct EIP712Signature[]",
            "name": "signatures",
            "type": "tuple[]"
          },
          {
            "internalType": "address",
            "name": "attester",
            "type": "address"
          }
        ],
        "internalType": "struct MultiDelegatedAttestationRequest[]",
        "name": "multiDelegatedRequests",
        "type": "tuple[]"
      }
    ],
    "name": "multiAttestByDelegation",
    "outputs": [
      {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "uid",
                "type": "bytes32"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct RevocationRequestData[]",
            "name": "data",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct MultiRevocationRequest[]",
        "name": "multiRequests",
        "type": "tuple[]"
      }
    ],
    "name": "multiRevoke",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "uid",
                "type": "bytes32"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct RevocationRequestData[]",
            "name": "data",
            "type": "tuple[]"
          },
          {
            "components": [
              {
                "internalType": "uint8",
                "name": "v",
                "type": "uint8"
              },
              {
                "internalType": "bytes32",
                "name": "r",
                "type": "bytes32"
              },
              {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
              }
            ],
            "internalType": "struct EIP712Signature[]",
            "name": "signatures",
            "type": "tuple[]"
          },
          {
            "internalType": "address",
            "name": "revoker",
            "type": "address"
          }
        ],
        "internalType": "struct MultiDelegatedRevocationRequest[]",
        "name": "multiDelegatedRequests",
        "type": "tuple[]"
      }
    ],
    "name": "multiRevokeByDelegation",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32[]",
        "name": "data",
        "type": "bytes32[]"
      }
    ],
    "name": "multiRevokeOffchain",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32[]",
        "name": "data",
        "type": "bytes32[]"
      }
    ],
    "name": "multiTimestamp",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "uid",
                "type": "bytes32"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct RevocationRequestData",
            "name": "data",
            "type": "tuple"
          }
        ],
        "internalType": "struct RevocationRequest",
        "name": "request",
        "type": "tuple"
      }
    ],
    "name": "revoke",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "schema",
            "type": "bytes32"
          },
          {
            "components": [
              {
                "internalType": "bytes32",
                "name": "uid",
                "type": "bytes32"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "internalType": "struct RevocationRequestData",
            "name": "data",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint8",
                "name": "v",
                "type": "uint8"
              },
              {
                "internalType": "bytes32",
                "name": "r",
                "type": "bytes32"
              },
              {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
              }
            ],
            "internalType": "struct EIP712Signature",
            "name": "signature",
            "type": "tuple"
          },
          {
            "internalType": "address",
            "name": "revoker",
            "type": "address"
          }
        ],
        "internalType": "struct DelegatedRevocationRequest",
        "name": "delegatedRequest",
        "type": "tuple"
      }
    ],
    "name": "revokeByDelegation",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "data",
        "type": "bytes32"
      }
    ],
    "name": "revokeOffchain",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "data",
        "type": "bytes32"
      }
    ],
    "name": "timestamp",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export type PROVIDER_ID =
  | "Signer"
  | "Google"
  | "Ens"
  | "Poh"
  | "POAP"
  | "Facebook"
  | "FacebookProfilePicture"
  | "Brightid"
  | "Github"
  | "TenOrMoreGithubFollowers"
  | "FiftyOrMoreGithubFollowers"
  | "ForkedGithubRepoProvider"
  | "StarredGithubRepoProvider"
  | "FiveOrMoreGithubRepos"
  | "githubContributionActivityGte#30"
  | "githubContributionActivityGte#60"
  | "githubContributionActivityGte#120"
  | "githubAccountCreationGte#90"
  | "githubAccountCreationGte#180"
  | "githubAccountCreationGte#365"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#1"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#10"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#25"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#100"
  | "GitcoinContributorStatistics#totalContributionAmountGte#10"
  | "GitcoinContributorStatistics#totalContributionAmountGte#100"
  | "GitcoinContributorStatistics#totalContributionAmountGte#1000"
  | "GitcoinContributorStatistics#numRoundsContributedToGte#1"
  | "GitcoinContributorStatistics#numGr14ContributionsGte#1"
  | "GitcoinGranteeStatistics#numOwnedGrants#1"
  | "GitcoinGranteeStatistics#numGrantContributors#10"
  | "GitcoinGranteeStatistics#numGrantContributors#25"
  | "GitcoinGranteeStatistics#numGrantContributors#100"
  | "GitcoinGranteeStatistics#totalContributionAmount#100"
  | "GitcoinGranteeStatistics#totalContributionAmount#1000"
  | "GitcoinGranteeStatistics#totalContributionAmount#10000"
  | "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1"
  | "Linkedin"
  | "Discord"
  | "GitPOAP"
  | "Snapshot"
  | "SnapshotProposalsProvider"
  | "SnapshotVotesProvider"
  | "ethPossessionsGte#1"
  | "ethPossessionsGte#10"
  | "ethPossessionsGte#32"
  | "FirstEthTxnProvider"
  | "EthGTEOneTxnProvider"
  | "EthGasProvider"
  | "SelfStakingBronze"
  | "SelfStakingSilver"
  | "SelfStakingGold"
  | "CommunityStakingBronze"
  | "CommunityStakingSilver"
  | "CommunityStakingGold"
  | "NFT"
  | "ZkSync"
  | "ZkSyncEra"
  | "Lens"
  | "GnosisSafe"
  | "Coinbase"
  | "GuildMember"
  | "GuildAdmin"
  | "GuildPassportMember"
  | "Hypercerts"
  | "PHIActivitySilver"
  | "PHIActivityGold"
  | "HolonymGovIdProvider"
  | "IdenaState#Newbie"
  | "IdenaState#Verified"
  | "IdenaState#Human"
  | "IdenaStake#1k"
  | "IdenaStake#10k"
  | "IdenaStake#100k"
  | "IdenaAge#5"
  | "IdenaAge#10"
  | "CivicCaptchaPass"
  | "CivicUniquenessPass"
  | "CivicLivenessPass"
  | "Twitter"
  | "TwitterTweetGT10"
  | "TwitterFollowerGT100"
  | "TwitterFollowerGT500"
  | "TwitterFollowerGTE1000"
  | "TwitterFollowerGT5000"
  | "twitterAccountAgeGte#180"
  | "twitterAccountAgeGte#365"
  | "twitterAccountAgeGte#730"
  | "twitterTweetDaysGte#30"
  | "twitterTweetDaysGte#60"
  | "twitterTweetDaysGte#120";

const providerBitMapInfo = [{ "bit": 0, "index": 0, "name": "SelfStakingBronze" }, { "bit": 1, "index": 0, "name": "SelfStakingSilver" }, { "bit": 2, "index": 0, "name": "SelfStakingGold" }, { "bit": 3, "index": 0, "name": "CommunityStakingBronze" }, { "bit": 4, "index": 0, "name": "CommunityStakingSilver" }, { "bit": 5, "index": 0, "name": "CommunityStakingGold" }, { "bit": 6, "index": 0, "name": "GitcoinContributorStatistics#numGrantsContributeToGte#1" }, { "bit": 7, "index": 0, "name": "GitcoinContributorStatistics#numGrantsContributeToGte#10" }, { "bit": 8, "index": 0, "name": "GitcoinContributorStatistics#numGrantsContributeToGte#25" }, { "bit": 9, "index": 0, "name": "GitcoinContributorStatistics#numGrantsContributeToGte#100" }, { "bit": 10, "index": 0, "name": "GitcoinContributorStatistics#totalContributionAmountGte#10" }, { "bit": 11, "index": 0, "name": "GitcoinContributorStatistics#totalContributionAmountGte#100" }, { "bit": 12, "index": 0, "name": "GitcoinContributorStatistics#totalContributionAmountGte#1000" }, { "bit": 13, "index": 0, "name": "GitcoinContributorStatistics#numGr14ContributionsGte#1" }, { "bit": 14, "index": 0, "name": "GitcoinContributorStatistics#numRoundsContributedToGte#1" }, { "bit": 15, "index": 0, "name": "GitcoinGranteeStatistics#numOwnedGrants#1" }, { "bit": 16, "index": 0, "name": "GitcoinGranteeStatistics#numGrantContributors#10" }, { "bit": 17, "index": 0, "name": "GitcoinGranteeStatistics#numGrantContributors#25" }, { "bit": 18, "index": 0, "name": "GitcoinGranteeStatistics#numGrantContributors#100" }, { "bit": 19, "index": 0, "name": "GitcoinGranteeStatistics#totalContributionAmount#100" }, { "bit": 20, "index": 0, "name": "GitcoinGranteeStatistics#totalContributionAmount#1000" }, { "bit": 21, "index": 0, "name": "GitcoinGranteeStatistics#totalContributionAmount#10000" }, { "bit": 22, "index": 0, "name": "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1" }, { "bit": 23, "index": 0, "name": "twitterAccountAgeGte#180" }, { "bit": 24, "index": 0, "name": "twitterAccountAgeGte#365" }, { "bit": 25, "index": 0, "name": "twitterAccountAgeGte#730" }, { "bit": 26, "index": 0, "name": "twitterTweetDaysGte#30" }, { "bit": 27, "index": 0, "name": "twitterTweetDaysGte#60" }, { "bit": 28, "index": 0, "name": "twitterTweetDaysGte#120" }, { "bit": 29, "index": 0, "name": "Discord" }, { "bit": 30, "index": 0, "name": "Google" }, { "bit": 31, "index": 0, "name": "githubAccountCreationGte#90" }, { "bit": 32, "index": 0, "name": "githubAccountCreationGte#180" }, { "bit": 33, "index": 0, "name": "githubAccountCreationGte#365" }, { "bit": 34, "index": 0, "name": "githubContributionActivityGte#30" }, { "bit": 35, "index": 0, "name": "githubContributionActivityGte#60" }, { "bit": 36, "index": 0, "name": "githubContributionActivityGte#120" }, { "bit": 37, "index": 0, "name": "Facebook" }, { "bit": 38, "index": 0, "name": "FacebookProfilePicture" }, { "bit": 39, "index": 0, "name": "Linkedin" }, { "bit": 40, "index": 0, "name": "Ens" }, { "bit": 41, "index": 0, "name": "Brightid" }, { "bit": 42, "index": 0, "name": "Poh" }, { "bit": 43, "index": 0, "name": "ethPossessionsGte#1" }, { "bit": 44, "index": 0, "name": "ethPossessionsGte#10" }, { "bit": 45, "index": 0, "name": "ethPossessionsGte#32" }, { "bit": 46, "index": 0, "name": "FirstEthTxnProvider" }, { "bit": 47, "index": 0, "name": "EthGTEOneTxnProvider" }, { "bit": 48, "index": 0, "name": "EthGasProvider" }, { "bit": 49, "index": 0, "name": "SnapshotVotesProvider" }, { "bit": 50, "index": 0, "name": "SnapshotProposalsProvider" }, { "bit": 51, "index": 0, "name": "GitPOAP" }, { "bit": 52, "index": 0, "name": "NFT" }, { "bit": 53, "index": 0, "name": "ZkSync" }, { "bit": 54, "index": 0, "name": "ZkSyncEra" }, { "bit": 55, "index": 0, "name": "Lens" }, { "bit": 56, "index": 0, "name": "GnosisSafe" }, { "bit": 57, "index": 0, "name": "Coinbase" }, { "bit": 58, "index": 0, "name": "GuildMember" }, { "bit": 59, "index": 0, "name": "GuildAdmin" }, { "bit": 60, "index": 0, "name": "GuildPassportMember" }, { "bit": 61, "index": 0, "name": "Hypercerts" }, { "bit": 62, "index": 0, "name": "PHIActivitySilver" }, { "bit": 63, "index": 0, "name": "PHIActivityGold" }, { "bit": 64, "index": 0, "name": "HolonymGovIdProvider" }, { "bit": 65, "index": 0, "name": "IdenaState#Newbie" }, { "bit": 66, "index": 0, "name": "IdenaState#Verified" }, { "bit": 67, "index": 0, "name": "IdenaState#Human" }, { "bit": 68, "index": 0, "name": "IdenaStake#1k" }, { "bit": 69, "index": 0, "name": "IdenaStake#10k" }, { "bit": 70, "index": 0, "name": "IdenaStake#100k" }, { "bit": 71, "index": 0, "name": "IdenaAge#5" }, { "bit": 72, "index": 0, "name": "IdenaAge#10" }, { "bit": 73, "index": 0, "name": "CivicCaptchaPass" }, { "bit": 74, "index": 0, "name": "CivicUniquenessPass" }, { "bit": 75, "index": 0, "name": "CivicLivenessPass" }]

export type StampBit = {
  bit: number;
  index: number;
  name: string;
};

export type DecodedProviderInfo = {
  providerName: PROVIDER_ID;
  providerNumber: number;
};

export default function Passport() {
  // here we deal with any local state we need to manage
  const [address, setAddress] = useState<string>('')
  const [resolverContract, setResolverContract] = useState<ethers.Contract>()
  const [EasContract, setEasContract] = useState<ethers.Contract>()
  const [connected, setConnected] = useState<boolean>()
  // const [uuid, setUuid] = useState<string>('')
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
      const uuid = await resolverContract.passports("0xC79ABB54e4824Cdb65C71f2eeb2D7f2db5dA1fB8")
      console.log(uuid)
      if (uuid == "0x0000000000000000000000000000000000000000000000000000000000000000") {
        (console.log("no passport data on chain!"))
      } else {
        return uuid
      }
    }
  }

  async function getAttestation(uuid: string) {
    if (connected) {
      const attestation = await EasContract.getAttestation(uuid)
      return attestation
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
    function toArray(item, index) {
      stamps.push(item.providerName)
    }
    setStamps(stamps)
    console.log("stamps", stamps)
    setHasStamps(stamps.includes('twitterAccountAgeGte#180'))
  }


  async function getInfo() {
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
          <Button colorScheme='teal' variant='outline' onClick={getInfo}>Query Passport</Button>
        </Flex>
        <br />
        <br />
        <Heading as='h1' size='4xl' noOfLines={2}>BaseGoerli Passport app</Heading>
        <Heading as='h1' size='xl' noOfLines={2}>Make sure your wallet is connected to Base Goerli!</Heading>
        <br />
        <br />
        {hasStamps && <Heading as='h1' size='xl'>"well done you have the right onchain stamps!" </Heading>}
        <br />
        <br />
        {!hasStamps && <Heading as='h1' size='xl'>"you don't have the right onchain stamps!" </Heading>}
      </ChakraProvider >
    </div >
  )
}
