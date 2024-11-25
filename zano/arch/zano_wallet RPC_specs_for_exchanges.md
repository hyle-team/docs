# Introduction
## Starting the daemon and the wallet application as RPC server
Zano command-line wallet application (simplewallet) can be run in RPC server mode. In this mode it can be controlled by RPC calls via HTTP and be used as a back-end for an arbitrary service.

Starting the wallet in RPC server mode:
1. Run zanod (the daemon application).
2. Run simplewallet with the following options:

`simplewallet --wallet-file PATH_TO_WALLET_FILE --password PASSWORD --rpc-bind-ip RPC_IP --rpc-bind-port RPC_PORT --daemon-address DEAMON_ADDR:DAEMON_PORT --log-file LOG_FILE_NAME`

where:

`PATH_TO_WALLET_FILE` — path to an existing wallet file (should be created beforehand using  `--generate-new-wallet command`);
`PASSWORD` — wallet password;
`RPC_IP` — IP address to bind RPC server to (127.0.0.1 will be used if not specified);
`RPC_PORT` — TCP port for RPC server;
`DEAMON_ADDR:DAEMON_PORT` — daemon address and port (may be omitted if the daemon is running on the same machine with the default settings);
`LOG_FILE_NAME` — path and filename of simplewallet log file.

Examples below are given with assumption that the wallet application is running in RPC server mode and listening at 127.0.0.1:12233.

All amounts and balances are represented as unsigned integers and measured in atomic units — the smallest fraction of a coin. One coin equals 10^12 atomic units.

## Integrated addresses for exchanges
Unlike Bitcoin, CryptoNote family coins have different, more effective approach on how to handle user deposits.
An exchange generates only one address for receiving coins and all users send coins to that address. To distinguish different deposits from different users the exchange generates random identifier (called <strong>payment ID</strong>) for each one and a user attaches this payment ID to his transaction while sending. Upon receiving, the exchange can extract payment ID and thus identify the user.
In original CryptoNote there were two separate things: exchange deposit address (the same for all users) and payment ID (unique for all users). Later, for user convenience and to avoid missing payment ID we combined them together into one thing, called <strong>integrated address</strong>. So nowadays modern exchanges usually give to a user an integrated address for depositing instead of pair of standard deposit address and a payment ID.

For more information on how to handle integrated addresses, please refer to RPCs make_integrated_address and split_integrated_address below.

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
`$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"getbalance"}'`

    {
     "id": "0",
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
`$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"getaddress"}'`

    {
     "id": "0",
     "jsonrpc": "2.0",
     "result": {
       "address": "ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA"
     }
    }

## transfer
Creates a transaction and broadcasts it to the network.
### Inputs:
destinations — list of transfer_destination objects (see below); list of recipients with corresponding amount of coins for each.

fee — unsigned int; transaction fee in atomic units. Minimum 105 atomic units, recommended 106 or 107.

mixin — unsigned int; number of foreign outputs to be mixed in with each input. Increases untraceability. Use 0 for direct and traceable transfers.

payment_id — string; hex-encoded payment id. Can be empty if payment id is not required for this transfer.

comment — string; text commentary which follow the transaction in encrypted form and is visible only to the sender and the receiver.

transfer_destination object fields:
address — string; standard or integrated address of a recipient.

amount — unsigned int; amount of coins to be sent;

### Outputs:
tx_hash — string; hash identifier of the transaction that was successfully sent.
tx_unsigned_hex — string; hex-encoded unsigned transaction (for watch-only wallets; to be used in cold-signing process).
### Examples
#### Not enough money
`$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"transfer", "params":{"destinations":[{"address":"ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA", "amount":10000000000000000000}]}}'`

    {
      "error": {
    	"code": -4,
    	"message": "not enough money"
      },
      "id": "5",
      "jsonrpc": "2.0"
    }

#### Fee is too small
`$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"transfer", "params":{"destinations":[{"address":"ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA", "amount":100000000}], "fee":10}}'`

    {
     "error": {
       "code": -4,
       "message": "transaction was rejected by daemon"
     },
     "id": "5",
     "jsonrpc": "2.0"
    }

#### Correct request
`$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"5","method":"transfer", "params":{"destinations":[{"address":"ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA", "amount":1000000000000}], "fee":1000000000}}'`

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

allow_locked_transactions — boolean; when requesting transactions from wallets, this parameter is used as a transaction filter, in which the unlock_time parameter is set to a value other than the safe values used by default. By default, this option is turned off, but if you need to - you can enable it and see all transactions (at your own risk).

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

## get_bulk_payments
Gets list of incoming transfers by given payment IDs.
### Inputs:
payment_ids — array of strings; hex-encoded payment IDs.

min_block_height — integer; minimum block height.

allow_locked_transactions — boolean; when requesting transactions from wallets, this parameter is used as a transaction filter, in which the unlock_time parameter is set to a value other than the safe values used by default. By default, this option is turned off, but if you need to - you can enable it and see all transactions (at your own risk).

### Outputs:
payments — list of payment_details object (see get_payments for details).
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

## make_integrated_address
Creates an integrated address for the wallet by embedding the given payment ID together with the wallet's public address.
### Inputs:
payment_id — string; hex-encoded payment identifier. If empty, random 8-byte payment ID will be generated and used.
### Outputs:
integrated_address — string; the result.

payment_id — string; hex-encoded payment ID, that was used (useful if an empty payment_id was given as an input).

### Examples
#### Empty payment ID
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"make_integrated_address","params":{"payment_id":""}}'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
      "result": {
       "integrated_address": "iZ25D6ReVWYffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHoSrxe72RZzxJ1LQ5XnacR",
        "payment_id": "717f5ad22cab26f4"
      }
    }
#### Invalid payment ID
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"make_integrated_address","params":{"payment_id":" !@&#*"}}'
`

    {
      "error": {
        "code": -5,
        "message": "invalid payment id given: ' !@&#*', hex-encoded string was expected"
      },
      "id": "3",
      "jsonrpc": "2.0"
    }
#### Correct payment ID
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"make_integrated_address","params":{"payment_id":"00000000FF00ff00"}}'
`

    {
      "id": "3",
      "jsonrpc": "2.0",
      "result": {
        "integrated_address": "iZ25D6ReVWYffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHoSrwfaxRfrgw3Bz18Df3m",
        "payment_id": "00000000ff00ff00"
      }
    }
## split_integrated_address
### Inputs:
integrated_address — string; integrated or standard address.
### Outputs:
standard_address — string; standard address with no payment ID attached

payment_id — string; hex-encoded payment ID, extracted from the given integrated address. Can be empty. Will be empty when a standard address is given as an input.

### Examples
#### Invalid integrated address
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"split_integrated_address","params":{"integrated_address":"!k9s02j23n"}}'
`

    {
      "error": {
        "code": -2,
        "message": "invalid integrated address given: '!k9s02j23n'"
      },
      "id": "3",
      "jsonrpc": "2.0"
    }

#### Valid integrated address
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"split_integrated_address","params":{"integrated_address":"iZ25D6ReVWYffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHoSrwfaxRfrgw3Bz18Df3m"}}'
`

    {
      "id": "3",
      "jsonrpc": "2.0",
      "result": {
        "payment_id": "00000000ff00ff00",
        "standard_address": "ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA"
      }
    }

#### Valid standard address
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"3","method":"split_integrated_address","params":{"integrated_address":"ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA"}}'
`

    {
      "id": "3",
      "jsonrpc": "2.0",
      "result": {
        "payment_id": "",
        "standard_address": "ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA"
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
tx_signed_hex — string; hex-encoded signed transaction as returned from sign_transfer call.

### Outputs:
tx_hash — string; transaction hash identifier.

### Examples
#### Transaction was rejected for some reason (see daemon logs for details)
`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"submit_transfer", "params":{  "tx_signed_hex": "00-LONG-HASH-00"  }'
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
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"submit_transfer", "params":{  "tx_signed_hex": "00-LONG-HASH-00"  }'
`

    {
      "id": "0",
      "jsonrpc": "2.0",
      "result": {
    	"tx_hash": "0554849abdb62f7d1902ddd14ce005722a340fc14fab4a375adc8749abf4e10b"
      }
    }

# Signing transactions offline (cold-signing process)
## Introduction
In order to provide more security it's possible to sign transactions offline using a dedicated wallet application instance e.g. running in a secure environment.
![cold-signing process](https://files.readme.io/ebd2fc1-pasted_image_0.png "cold-signing process")
Zano as a CryptoNote coin uses two key pairs (4 keys) per wallet: view key (secret+public) and spend key (secret+public)

So called "hot wallet" (or watch-only wallet) uses only view secret key. This allows it to distinguish its transactions among others in the blockchain. To spend coins a wallet needs spend secret key. It is required to sign a tx. Watch-only wallet don't have access to spend secret key and thus it can't spend coins.

If someone has your spend secret key, he can spend your coins. Master keys should be handled with care.

## Setup
1. In a secure environment create a new master wallet:

   1.1 Start simplewallet to generate master wallet:

   **simplewallet --generate-new-wallet zano_wallet_master**
   (zano_wallet_master is wallet's filename and can be changed freely)

   1.2 Type in a password when asked.

   1.3 Type the following command into wallet's console:

   **save_watch_only zano_wallet_watch_only.keys WATCH_PASSWORD**

   where WATCH_PASSWORD is password for a watch-only wallet.

   You should see:

   **Keys stored to zano_wallet_watch_only.keys**

   1.4 Type **exit** to quit simplewallet.

2. Copy zano_wallet_watch_only.keys file from secure environment to your production environment where daemons and hot wallet are supposed to be run.

**<blockquote>
	NOTE: zano_wallet_master.keys file contains master wallet private keys! You may want it to never leave secure environment.</blockquote>**
3. In production environment start the daemon (let it perform initial sync if running for the first time and make sure it is synchronized), then start the watch-only wallet: 

**simplewallet --wallet-file zano_wallet_watch_only.keys --password WATCH_PASSWORD** 

**--rpc-bind-ip RPC_IP --rpc-bind-port RPC_PORT --daemon-address DEAMON_ADDR:DAEMON_PORT** 

**--log-file LOG_FILE_NAME**

(see also the Introduction; for the first run you can add **--log-level=0** to avoid too verbose messages, for subsequent runs you can use **--log-level=1** or **--log-level=2**)

Setup is complete.

## Example of a transaction cold-signing
In order to sign a transaction, follow these steps:

4. Using RPC transfer create a transaction.
Because of using watch-only wallet keys for this instance of wallet application (please note passing **zano_wallet_watch_only.keys** in i.3) a transaction will not be signed and broadcasted. Instead, unsigned transaction will be prepared and returned via RPC.

RPC example (please, see also transfer RPC description in "List of RPC calls" section above):

`
$ curl http://127.0.0.1:12233/json_rpc -s -H 'content-type:application/json;' --data-binary '{"jsonrpc":"2.0","id":"0","method":"transfer", "params":{   "destinations":[{"amount":1000000000000, "address":"ZxCb5oL6RTEffiH9gj7w3SYUeQ5s53yUBFGoyGChaqpQdud2uNUaA936Q2ngcEouvmgA48WMZQyv41R2ASstyYHo2Kzeoh7GA"}], "fee":1000000000, "mixin":0, "unlock_time":0   }}'
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

**simplewallet --wallet-file zano_wallet_master --password MASTER_PASSWORD --offline-mode**

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

Signed transaction data retrieved in tx_signed_hex field should be passed to the production environment along with the corresponding tx_unsigned_hex data to be broadcasted by watch-only wallet.

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

The transaction was successfully broadcasted over the network.

## Important note on watch-only wallets
Watch-only wallet is not able naturally to calculate a balance using only a tracking view secret key and an access to the blockchain. This happens because it can't distinguish spending its own coins as it requires knowing key images for own coins, which are unknown, as key image calculation requires spend secret key.

To workaround this difficulty watch-only wallet extracts and stores key images for own coins each time a signed transaction from a cold wallet is broadcasted using submit_transfer RPC. This data is stored locally and it is required to calculate wallet's balance in case of full wallet resync.

It's important to keep this data safe and not to delete watch-only wallet's files. Otherwise, watch-only wallet won't be able to calculate a balance correctly and cold wallet may be required to be connected online for recovering funds.
