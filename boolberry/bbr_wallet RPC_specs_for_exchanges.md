# Introduction to Wallet RPC
Boolberry command-line wallet application (simplewallet) can be run in RPC server mode. In this mode it can be controlled by RPC calls via HTTP and be used as a back-end for an arbitrary service.

Starting the wallet in RPC server mode:
1. Run boolbd (the daemon application).
2. Run simplewallet with the following options:
`
simplewallet --wallet-file PATH_TO_WALLET_FILE --password PASSWORD --rpc-bind-ip RPC_IP --rpc-bind-port RPC_PORT --daemon-address DEAMON_ADDR:DAEMON_PORT --log-file LOG_FILE_NAME
`

where:

*PATH_TO_WALLET_FILE* — path to an existing wallet file (should be created beforehand using  *--generate-new-wallet command*);

*PASSWORD* — wallet password;

*RPC_IP* — IP address to bind RPC server to (127.0.0.1 will be used if not specified);

*RPC_PORT* — TCP port for RPC server;

*DEAMON_ADDR:DAEMON_PORT* — daemon address and port (may be omitted if the daemon is running on the same machine with the default settings);

*LOG_FILE_NAME* — path and filename of simplewallet log file.

Examples below are given with assumption that the wallet application is running in RPC server mode and listening at 127.0.0.1:12233.

All amounts and balances are represented as unsigned integers and measured in atomic units — the smallest fraction of a coin. One coin equals 10^12 atomic units.

# List of Wallet RPCs
## getbalance
Retrieves current wallet balance: total and unlocked.
### Inputs:
None.
### Outputs:
balance — unsigned integer; total amount of funds the wallet has (unlocked and locked coins).

unlocked_balance — unsigned integer; unlocked funds, i.e. coins that are stored deep enough in the blockchain to be considered relatively safe to spend. Only this amount of coins are immediately spendable.

unlocked_balance is always less or equal to balance.
### Examples
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"getbalance"}'
`

    {
     "id": "3",
     "jsonrpc": "2.0",
     "result": {
       "balance": 160810073397000000,
       "unlocked_balance": 160810073397000000
     }
    }

## getaddress
Obtains wallet public address.
### Inputs:
None.
### Outputs:
address — string; standard public address of the wallet.
### Examples
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"getaddress"}'
`

    {
     "id": "3",
     "jsonrpc": "2.0",
     "result": {
       "address": "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm"
     }
    }

## transfer
Creates a transaction and broadcasts it to the network.
### Inputs:
destinations — list of transfer_destination objects (see below); list of recipients with corresponding amount of coins for each.

fee — unsigned int; transaction fee in atomic units. Minimum 105 atomic units, recommended 106 or 107.

mixin — unsigned int; number of foreign outputs to be mixed in with each input. Increases untraceability. Use 0 for direct and traceable transfers.

payment_id — string; hex-encoded payment id. Can be empty if payment id is not required for this transfer.

transfer_destination object fields:
address — string; standard or integrated address of a recipient.
amount — unsigned int; amount of coins to be sent;

### Outputs:
tx_hash — string; hash identifier of the transaction that was successfully sent.
tx_unsigned_hex — string; hex-encoded unsigned transaction (for watch-only wallets; to be used in cold-signing process).
### Examples
#### Not enough money
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"transfer", "params":{"destinations":[{"address":"1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "amount":10000000000000000000}]}}'
`

    {
      "error": {
    	"code": -4,
    	"message": "not enough money"
      },
      "id": "5",
      "jsonrpc": "2.0"
    }

#### Fee is too small
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"transfer", "params":{"destinations":[{"address":"1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "amount":100000000}], "fee":10}}'
`

    {
     "error": {
       "code": -4,
       "message": "transaction was rejected by daemon"
     },
     "id": "5",
     "jsonrpc": "2.0"
    }

#### Correct request
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"transfer", "params":{"destinations":[{"address":"1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "amount":1000000000000}], "fee":1000000000}}'
`

    {
      "id": "5",
      "jsonrpc": "2.0",
      "result": {
     	"tx_blob": "00-LONG-HEX-00",
    	"tx_hash": "5412a90afa64faf727946697d70c2989585bbb18c9a232b2c4ac7b7ebd6307aa",
    	"tx_unsigned_hex": "00-LONG-HEX-00"
      }
    }
    
## store
Saves wallet update progress into a wallet file. Although progress is always saved upon graceful wallet application termination, with this call a user can manually trigger saving process. Otherwise, in a case of abnormal wallet application termination the progress won’t be saved and it will take some time to synchronize on the next launch.
### Inputs:
None.
### Outputs:
None.
### Examples
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"store"}'
`

    {
     "id": "3",
     "jsonrpc": "2.0",
     "result": {
     }
    }

## get_payments
Gets list of incoming transfers by a given payment id.
### Inputs:
payment_id — string; hex-encoded payment id.
### Outputs:
result — list of payments object.

payments object fields:

amount — unsigned int; amount of coins in atomic units.

block_height — unsigned int; height of the block containing corresponding transaction.

tx_hash — string; transaction hash.

unlock_time — unsigned int; if non-zero — unix timestamp after which this transfer coins can be spent. If it is less than 500000000, the value is treated as a minimum block height at which this transfer coin can be spent.
### Examples
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"get_payments", "params":{"payment_id":"aaaa"}'
`

    {
      "id": "5",
      "jsonrpc": "2.0",
      "result": {
    	"payments": [{
      	"amount": 100000000000000,
      	"block_height": 131944,
      	"payment_id": "aaaa",
      	"tx_hash": "176416cb542884e10f826627f87df6cf45a16039f913deb2e41f5f2d0647a96d",
      	"unlock_time": 0
    	}]
      }
    }

## sweep_below
Attempts to merge all outputs with amount less than specified and transfer it to a given address. RPC will try to collect as many outputs as possible thus a user may be required to run this RPC more than once in order to transfer all funds which meet amount criteria. On success generates one transaction.

### Inputs:
address — string; funds transfer destination. Integrated addresses are allowed if payment_id_hex is empty or unspecified.

amount — unsigned integer; upper boundary for output amount. Outputs with less amount than specified value are considered as candidates to be included into the transaction.

fee — unsigned integer; transaction fee.

payment_id_hex — string (optional); payment identifier of the transaction.

mixin — unsigned integer (optional); number of fake outputs to be mixed in with real ones for better untraceability. Default is zero.
unlock_time — unsigned integer (optional); timestamp or block height in the future when generated transaction becomes spendable. Default if zero (no lock time).

### Outputs:
amount_swept — unsigned integer; sum of output amounts that were actually swept, i.e. transferred to the given address.

amount_total — unsigned integer; total sum of all output amounts satisfying amount criteria that were present in the wallet prior to this operation.

outs_swept — unsigned integer; number of outputs that were actually swept, i.e. transferred to the given address.

outs_total — unsigned integer; total number of all outputs satisfying amount criteria that were present in the wallet prior to this operation. If outs_swept equals to outs_total it means that all such outputs were successfully swept. Otherwise a user may want to call this method again to take care of left outputs.

tx_hash — string; hash identifier of generated transaction.

### Examples
#### Using only required inputs
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"sweep_below", "params" : {"address" : "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "fee":10000000, "amount":10000000000000}}'
`

    {
      "id": "3",
      "jsonrpc": "2.0",
      "result": {
        "amount_swept": 233274242000000,
        "amount_total": 59050073447000000,
        "outs_swept": 266,
        "outs_total": 65288,
        "tx_hash": "81850227ea4c96ed88b47bca954213098f97db94118e2289e9ace7eac27e1db5"
      }
     }

#### Using all inputs
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"sweep_below", "params" : {"address" : "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "fee":10000000, "amount":10000000000000, "mixin": 1, "payment_id_hex":"aabbcc", "unlock_time":110000}}'
`

    {
      "id": "3",
      "jsonrpc": "2.0",
      "result": {
        "amount_swept": 137561033000000,
        "amount_total": 58820073437000000,
        "outs_swept": 133,
        "outs_total": 65029,
        "tx_hash": "1c3cc18ad5aa3434d85e265507dd0edceca52a7349e31c97dae79b5221b38142"
      }
    }
    
#### Error (blockchain doesn’t contain enough outputs for mixing in)
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"sweep_below", "params" : {"address" : "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "fee":10000000, "amount":10000000000000, "mixin": 10}}'
`

    {
      "error": {
        "code": -4,
        "message": "not enough outputs to mix"
      },
      "id": "3",
      "jsonrpc": "2.0"
    }

#### Error (there are no such outputs in the wallet)
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"sweep_below", "params" : {"address" : "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "fee":10000000, "amount":1000}}'
`

    {
      "error": {
        "code": -4,
        "message": "No spendable outputs meet the criterion"
      },
      "id": "3",
      "jsonrpc": "2.0"
    }

## get_bulk_payments
Gets list of incoming transfers by given payment IDs.
### Inputs:
payment_ids — array of strings; hex-encoded payment IDs.
min_block_height — integer; minimum block height.

### Outputs:
payments — list of payment_details object.

Fields of payment_details object:

payment_id — string; hex-encoded payment ID.

tx_hash — string; transaction hash identifier.

amount — integer; transfer amount.

block_height — integer; height of a block containing corresponding transaction.

unlock_time — integer; transaction unlock time.

### Example
`
$  curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"get_bulk_payments", "params":{"payment_ids":["aaaa", "bbbb"]}'
`

    {
      "id": "5",
      "jsonrpc": "2.0",
      "result": {
	    "payments": [{
      	"amount": 100000000000000,
      	"block_height": 131944,
      	"payment_id": "aaaa",
      	"tx_hash": "176416cb542884e10f826627f87df6cf45a16039f913deb2e41f5f2d0647a96d",
      	"unlock_time": 0
    	}]
      }
    }

## get_transfers
Retrieves filtered list of transfers.
### Inputs:
in — boolean; if true then incoming transactions will be taken into account.

out — boolean; if true then outgoing transactions will be taken into account.

pending — boolean; not supported yet, will be ignored.

failed — boolean; not supported yet, will be ignored.

pool — boolean; if true then unconfirmed in/out txs will be taken into account.

filter_by_height — boolean; if true then transfers will be filtered by block height.

min_height — integer; minimum block height (including).

max_height — integer; maximum block height (including).

### Outputs:
in — list of wallet_transfer_info objects, corresponding to incoming transactions;

out — list of wallet_transfer_info objects, corresponding to outgoing transactions.

pool — list of wallet_transfer_info objects, corresponding to unconfirmed transactions.

Fields of wallet_transfer_info object:

amount — integer; transfer amount.

timestamp — integer; transaction timestamp.

tx_hash — string; transaction identifier.

height — integer; corresponding block height (zero means unconfirmed).

unlock_time — integer; transaction unlock time.

tx_blob_size — integer; transaction size in bytes.

payment_id — string; hex-encoded payment ID.

destinations — string; destination address or addresses.

destination_alias — string; destination alias that was used (if any).

is_income — boolean; true if this transfer is an incoming transfer.

fee — integer; transaction fee.

td — object of wallet_transfer_info_details object (see below).


wallet_transfer_info_details fields:

rcv — list of integers; indices of received transfers.

spn — list of integers; indices of spent transfers.

### Example
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"get_transfers", "params":{"out":True}'
`

    {
      "id": "5",
      "jsonrpc": "2.0",
      "result": {
    	"out": [{
      	"amount": 1000000000000,
      	"destination_alias": "",
      	"destinations": "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm",
      	"fee": 0,
      	"height": 90050,
      	"is_income": false,
      	"payment_id": "",
      	"td": {
        	"spn": [1000000000000]
       	},
       	"timestamp": 1538121147,
      	"tx_blob_size": 264,
      	"tx_hash": "52668b38d70e5456ff578d29749ac141beac7e4410935941d86d1761e4615901",
      	"unlock_time": 0
	    }]
      }
    }

## convert_address
Converts standard address into an integrated address and vica versa.

### Inputs and outputs:
address_str — string; standard address.

payment_id_hex — string; hex-encoded payment id.

integrated_address_str — string; integrated address.

This RPC does conversion both ways:
1) if address_str and payment_id_hex are both given they are combined into integrated_address_str.
2) if integrated_address_str is given it's split into address_str and payment_id_hex.

### Examples
#### Standard address and payment ID into an integrated address
`
$  curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"convert_address", "params":{"address_str":"1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm", "payment_id_hex":"aabbcc"}}'
`

    {
      "id": "5",
      "jsonrpc": "2.0",
      "result": {
    	"address_str": "",
    	"integrated_address_str":     "bbRAmEkwnXj4UdFUPFAPE64EBsvTz2MGwWbuWoxdjyJKaXnuR4rd2jNfhpiBgBX6aYXmEw7XtWQpEVSh35jrfUUfdVsutRe5o6TAm9",
	    "payment_id_hex": ""
      }
    }

#### Integrated address into a standard address and payment ID
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"convert_address", "params":{"integrated_address_str":"bbRAmEkwnXj4UdFUPFAPE64EBsvTz2MGwWbuWoxdjyJKaXnuR4rd2jNfhpiBgBX6aYXmEw7XtWQpEVSh35jrfUUfdVsutRe5o6TAm9"}}'
`

    {
      "id": "5",
      "jsonrpc": "2.0",
      "result": {
    	"address_str": "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm",
    	"integrated_address_str": "",
    	"payment_id_hex": "aabbcc"
      }
    }

## sign_transfer
Signs a transaction prepared by watch-only wallet (for cold-signing process).
NOTE: this method requires spending private key and can't be served by watch-only wallets.

### Inputs:
tx_unsigned_hex — string; hex-encoded unsigned transaction as returned from transfer call.

### Outputs:
tx_hash — string; hash identifier of signed transaction.

tx_signed_hex — string; hex-encoded signed transaction.

### Example
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"sign_transfer", "params":{  "tx_unsigned_hex" : "00-LONG-HEX-00" }'
`

     {
       "id": "0",
      "jsonrpc": "2.0",
      "result": {
            "tx_hash": "855ae466c59b24295152740e84d7f823eaf3c91adfb1ba7b4ff1dc6085b79e63",
    	"tx_signed_hex": "00-LONG-HEX-00"
      }
    }

## submit_transfer
Broadcasts transaction that was previously signed using sign_transfer call.
This method is designed for using with watch-only wallets that are unable to sign transactions by themselves.

### Inputs:
tx_unsigned_hex — string; hex-encoded unsigned transaction as returned from transfer call.

tx_signed_hex — string; hex-encoded signed transaction as returned from sign_transfer call.

### Outputs:
tx_hash — string; transaction hash identifier.

### Examples
#### Transaction was rejected for some reason (see daemon logs for details)
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"submit_transfer", "params":{  "tx_unsigned_hex": "00-LONG-HASH-00", "tx_signed_hex": "00-LONG-HASH-00"  }'
`

    {
      "error": {
    	"code": -4,
    	"message": "transaction was rejected by daemon"
      },
      "id": "0",
      "jsonrpc": "2.0"
    }

#### Transaction successfully sent
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"submit_transfer", "params":{  "tx_unsigned_hex": "00-LONG-HASH-00", "tx_signed_hex": "00-LONG-HASH-00"  }'
`

     {
     "id": "0",
       "jsonrpc": "2.0",
      "result": {
    	"tx_hash": "0554849abdb62f7d1902ddd14ce005722a340fc14fab4a375adc8749abf4e10b"
      }
    }

## cancel_transfer
Mark all outputs reserved for a transaction as unspent and available for further spending.


This method is designed for using with watch-only wallets in a case when a transaction was prepared (using transfer method), then possibly signed (sign_transfer), but has not been broadcasted yet (submit_transfer) and for some reason a user decided to never broadcast it and he needs to free all locked coins associated with it.

**<blockquote>
WARNING: If a transaction that was cancelled using this method would be submitted later (submit_transfer) it can lead to unrecoverable wallet errors that would require wallet's resynchronization! The same issues will arise if a successfully broadcasted transaction would be cancelled using this method!
</blockquote>**
  
### Inputs:
tx_unsigned_hex — string; hex-encoded unsigned transaction as returned from transfer call.

### Outputs:
None.

### Examples
#### Transaction has outputs that was already unlocked (it may be already cancelled)
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"cancel_transfer", "params":{ "tx_unsigned_hex": "0000_LONG_HEX_0000" }'
`

    {
      "error": {
	    "code": -4,
    	"message": "internal error: transfer #76331 is NOT spent as expected. Please, resynchronize the wallet from scratch."
      },
      "id": "0",
      "jsonrpc": "2.0"
    }

#### Transaction successfully cancelled
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"cancel_transfer", "params":{ "tx_unsigned_hex": "0000_LONG_HEX_0000" }'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
      "result": {
      }
    }

# Introduction to Daemon RPC
Boolberry command-line daemon application (boolbd) can be controlled by remote procedure calls (RPC) and can be used as a back-end for user-defined services.

The daemon starts in RPC server mode by default. To specify the RPC port or bind address the user will need to run viried with the following options:

`booldb --rpc-bind-ip RPC_IP --rpc-bind-port RPC_PORT --daemon-address`

where:

*RPC_IP* — IP address to bind RPC server to (127.0.0.1 will be used if not specified);
*RPC_PORT* — TCP port for RPC server (50102 is default);

# List of additional Daemon RPCs
## check_tx_with_view_key
Scans across all the outputs of a given transaction and checks whether them target the given address. Sums up all such outputs to calculate amount of coins received by the address. View secret key is required. 

### Inputs:
tx_hash — string; transaction identifier.

address — string; public address.

view_key — string; hex-encoded view secret key corresponding to the given address.


### Outputs:
amount_received — integer; amount of funds that the specified address has received with the specified transaction.

outs_indicies — array of integers; idecies of transaction outputs which target specified address (field may not be present if there are not such outputs).

payment_id_hex — string; hex-encoded payment identifier (or empty string if not present).


### Examples
#### Transaction has no outputs related to the given address
`
$ curl http://127.0.0.1:50102/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"check_tx_with_view_key", "params" : {  "tx_hash" : "85125ee137f6db8cccb0db19cb2f8090e17c41591f53493487fb7fdf1b41c451", "view_key" : "27df94447dbbfbb5b5af58393400a16e7cf4b20efd0222de2cc5e848093ff808", "address" : "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm"}'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
      "result": {
        "amount_received": 0,
        "payment_id_hex": ""
      }
    }

#### Transaction has output(s) related to the given address
`
$ curl http://127.0.0.1:50102/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"check_tx_with_view_key", "params" : {  "tx_hash" : "fda323a2a06c6b8136d01bece28c35449376b809d9be09d1ace7b241e4036bf1", "view_key" : "27df94447dbbfbb5b5af58393400a16e7cf4b20efd0222de2cc5e848093ff808", "address" : "1LHWBr8ZJL7QYSupDzdzkSRPiVp7n5brhDWHcWPjSifGcRKHYCQuG1S7XedbS1vQrn7GC3u2HbUL3SWcd5rbKY2FT32Vtkm"}'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
      "result": {
        "amount_received": 199999000000000,
        "outs_indicies": [0,1,2,3,4,5,6,7],
        "payment_id_hex": "aabbcc"
      }
    }

# Signing transactions offline (cold-signing process)
In order to provide more security it's possible to sign transactions separately using a dedicated wallet application instance e.g. running in a secure environment.
![cold-signing process](https://github.com/hyle-team/docs/blob/master/boolberry/boolb_cold-signing%20process.png?raw=true "cold-signing process")

The following steps show an example of cold-signing process.

1. In a secure environment create new master wallet:

   1.1 Start simplewallet to generate master wallet:

       **simplewallet --generate-new-wallet bbr_wallet_master**
   (bbr_wallet_master is wallet's filename and can be changed freely)

   1.2 Type in a password when asked.

   1.3 Type the following command into wallet's console:

       **save_watch_only bbr_wallet_watch_only.keys WATCH_PASSWORD**

   where WATCH_PASSWORD is password for a watch-only wallet.

   You should see:

       **Keys stored to bbr_wallet_watch_only.keys**

   1.4 Type **exit** to quit simplewallet.

2. Copy bbr_wallet_watch_only.keys file from secure environment to your production environment where daemons and hot wallet are supposed to be run.

**<blockquote>
	NOTE: bbr_wallet_master.keys file contains master wallet private keys! You may want it to never leave secure environment.
</blockquote>**
3. In production environment start the daemon (let it perform initial sync if running for the first time and make sure it is synchronized), then start the watch-only wallet:

    **simplewallet --wallet-file bbr_wallet_watch_only.keys --password WATCH_PASSWORD** 

    **--rpc-bind-ip RPC_IP --rpc-bind-port RPC_PORT --daemon-address** 

    **DEAMON_ADDR:DAEMON_PORT --log-file LOG_FILE_NAME**

(see also the Introduction; for the first run you can add **--log-level=0** to avoid too verbose messages, for subsequent runs you can use **--log-level=1** or **--log-level=2**)

Setup is complete.

4. Using RPC transfer create a transaction.
Because of using watch-only wallet keys for this instance of wallet application (please note passing **bbr_wallet_watch_only.keys** in i.3) a transaction will not be signed and broadcasted. Instead, unsigned transaction will be prepared and returned via RPC.

RPC example (please, see also transfer RPC description in "List of RPC calls" section above):

`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"transfer", "params":{   "destinations":[{"amount":1000000000000, "address":"1BAEEyNqgJ4RyHmMRDgGaTMG17D6JFAGV5G3yLYjV4hPMYaW4NvfiNhiGsGDi1f1BrYpZkAHxQHvuhujy62K3xqiCpgkq2L"}], "fee":1000000000, "mixin":0, "unlock_time":0   }}'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
      "result": {
	    "tx_blob": "",
	    "tx_hash": "c41589e7559804ea4a2080dad19d876a024ccb05117835447d72ce08c1d020ec",
	    "tx_unsigned_hex": "00-LONG-HEX-00"
      }
    }

Unsigned transaction data retrieved in tx_unsigned_hex field should be passed to secure environment for cold-signing by master wallet.

5. Run master wallet within secure environment:

    **simplewallet --wallet-file bbr_wallet_master --password MASTER_PASSWORD --offline-mode**

6. Using RPC sing_transfer sing the transaction using master wallet.

RPC example:
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"sign_transfer", "params":{  "tx_unsigned_hex" : "00-LONG-HEX-00" }'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
       "result": {
    	"tx_signed_hex": "00-LONG-HEX-00"
      }
    }

Signed transaction data retrieved in tx_signed_hex field should be passed to the production environment along with corresponding tx_unsigned_hex data to be broadcasted by watch-only wallet.

7. Using RPC submit_transfer broadcast the transaction using watch-only wallet.

RPC example:

`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"submit_transfer", "params":{  "tx_unsigned_hex": "00-LONG-HASH-00", "tx_signed_hex": "00-LONG-HASH-00"  }'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
      "result": {
    	"tx_hash": "0554849abdb62f7d1902ddd14ce005722a340fc14fab4a375adc8749abf4e10b"
      }
    }

The transaction is successfully broadcasted over the network.

