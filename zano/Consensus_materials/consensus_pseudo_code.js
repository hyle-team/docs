

/**
 * 
 *  This is an explanational pseudocode, it written in definition-like style, with very minimal checks, in real code all calculations are optimized, precalculated and stored in the state storage
 * 
 */


var transaction_prefix = {
  varsion: 1,
  extra_data: [],                    //some extra data associated with transaction, encrypted
  inputs: [],                        //inputs that this transaction spend
  outputs: [],                       //outputs that this transaction create
}

var transaction = {
  transaction_prefix: transaction_prefix,
  signatures: []
}


var block = {
  major_version: 1,
  minor_version: 1,
  timestamp: 1735227022,              //linux timestamp of the block
  prev_id: "7325091c34ace13777f5d61db587cbaf51a5cb22ac18a10e0be01b8253d60a84",    
  nonce: 82429746,                    //PoW nonce
  flags: 0,                           //empty
  miner_tx: transaction,              //coinbase
  tx_hashes: ["c2b7cfd3702465cc5bc9e7718b97f5a53e87e8b13db50c089c8d954dcf4d418f", "d766da6e626fadefb8f713c53bc1b090036e63333b56b41892c61c05404774bc"]
}


//this would describe block entry structure, that stored in the full node database
var block_entry = {
  block,                                                    //block itself
  height: 100,                                              //block's height, if it's main chain then it equal to index in the vector of blocks starting from genesis
  is_pos: false,                                            //show if this block is a PoW os PoS  
  hash: "08b4fa21dcea0a2e252f5585cf0928cdb8a042ea11ed071230eb05bdeb61ad9e",   // block id
  cached_difficulty: 1000000000,                            //difficluty of the network at given height, 
  cached_cumulative_difficulty: 100000000000000,            //cumulative difficulty for this block, basically summ of all difficulties of given block type(PoW or PoS) since gensis
  
  cached_cumulative_difficulty_adjusted: 982382313411244,   //adjusted cumulative difficulty for this block, summ of all adjusted difficulties of given block type(PoW or PoS) since
                                                            //gensis. Term "adjusted" means that this difficulty might had been altered by rule of "sequence factor", look at the white paper 
                                                            //https://github.com/hyle-team/docs/blob/master/zano/Zano_WP_latest.pdf section "Hybrid PoS—PoW Consensus Mechanism"->Sequencing  for explanation and formula. 
                                                            //Note to avoid confusion: cumulative_difficulty_adjusted never involved in difficulty adjustment function, that used for keeping 
                                                            //blocks generated in target time periods, this function operates only on top of cached_cumulative_difficulty, while cumulative_difficulty_adjusted
                                                            //is needed only for the fork choice rule. 
  
  total_fees: 111111,                                       // sum of all fees of transactions that included in this block (note: fees are not added to block reward but burned)
  kernel_hash: "d846ef6c447a0e12eeee85533ab294a71c447ddfcdced58910989563bfbcf529"     //only for PoS blocks, sha3 of "kernel" structure, key component of PoS block
}

//
// "blockchain[]", main_chain or alt_chain are normally a vector of "block_entry" structures
//


/***********************************************************************
 *   DIFFICULTY DEFINITION
 ***********************************************************************/


const TARGET_SECONDS  =  120;
const DIFFICULTY_WINDOW  =  720;
const DIFFICULTY_CUT = 60;   // outliers cut



function get_adjustment_zone(length, REDEF_DIFFICULTY_WINDOW, REDEF_DIFFICULTY_CUT_OLD, REDEF_DIFFICULTY_CUT_LAST)
{
  var cut = {cut_begin: 0, cut_end: 0 };
  
  //cutoff DIFFICULTY_LAG
  if (length <= REDEF_DIFFICULTY_WINDOW - (REDEF_DIFFICULTY_CUT_OLD + REDEF_DIFFICULTY_CUT_LAST))
  {
    cut.cut_begin = 0;
    cut.cut_end = length;
  }
  else
  {
    cut.cut_begin = REDEF_DIFFICULTY_CUT_LAST;
    cut.cut_end = cut.cut_begin + (REDEF_DIFFICULTY_WINDOW - (REDEF_DIFFICULTY_CUT_OLD + REDEF_DIFFICULTY_CUT_LAST));
    if (cut.cut_end > length)
      cut.cut_end = length;
    
  }
  return cut;
}

function calculate_next_difficulty_for_zone(vector_of_timestamps_sorted, vector_of_cumulative_difficultiess, target_seconds, REDEF_DIFFICULTY_WINDOW, REDEF_DIFFICULTY_CUT_OLD, REDEF_DIFFICULTY_CUT_LAST)
{
  var length = vector_of_timestamps_sorted.size();
  var cut = get_adjustment_zone(length, REDEF_DIFFICULTY_WINDOW, REDEF_DIFFICULTY_CUT_OLD, REDEF_DIFFICULTY_CUT_LAST);
  var cut_begin = cut.cut_begin;
  var cut_end = cut.cut_end;
  

  var time_span = vector_of_timestamps_sorted[cut_begin] - vector_of_timestamps_sorted[cut_end - 1];
  if (time_span == 0)
  {
    time_span = 1;
  }
  var total_work = vector_of_cumulative_difficultiess[cut_begin] - vector_of_cumulative_difficultiess[cut_end - 1];

  var res = (total_work * target_seconds + time_span - 1) / time_span;
  return res;
}

function calculate_next_difficulty(vector_of_timestamps, vector_of_cumulative_difficulties)
{
  sort(vector_of_timestamps);

  var dif_slow = calculate_next_difficulty_for_zone(vector_of_timestamps, vector_of_cumulative_difficulties, TARGET_SECONDS, DIFFICULTY_WINDOW, DIFFICULTY_CUT / 2, DIFFICULTY_CUT / 2);
  var dif_medium = calculate_next_difficulty_for_zone(vector_of_timestamps, vector_of_cumulative_difficulties, TARGET_SECONDS, DIFFICULTY_WINDOW / 3, DIFFICULTY_CUT / 8, DIFFICULTY_CUT / 12);
  return (dif_slow + dif_medium) / 2;
}

function get_difficulty_for_height(height, is_pow, blockchain)
{
  var timestamps = [];
  var cumulative_difficulties = [];
  for (let i = height - 1; i >= 0; i--) 
  {
    if(blockchain[i].is_pow === is_pow)
    {
      timestamps.push_back(blockchain[i].block.timestamp);
      cumulative_difficulties.push_back(blockchain[i].cumulative_difficulty);
    }
    if(cumulative_difficulties.length >= 720)
      break;
  }
  
  return calculate_next_difficulty(timestamps, vector_of_cumulative_difficulties);
}

function alter_difficulty_with_sequence_factor(sequence_factor, difficulty)
{
  //delta=delta*(0.75^n)
  for (var i = 0; i != sequence_factor; i++)
    {
      difficulty = difficulty - difficulty / 4;
    }
    return difficulty;
}

function get_sequence_factor_for_height(height, is_pos, blockchain)
{
  var n = 0;
  var sz = height;

  for (var i = sz - 1; i != 0; --i, n++)
  {
    if (is_pos != blockchain[i].is_pos)
      break;
  }
  return n;
}

function get_cumulative_difficulty_for_height(height, is_pow, blockchain)
{
  /**
   * 
   *   this function return cumulative difficulty for the given height in the main chain
   *   if "is_pow" is true then returned PoW cumulative difficulty for the given height in the main chain
   *   if "is_pow" is false then returned PoS cumulative difficulty for the given height in the main chain
   *    
   *  "cumulative difficulty"(CD) at given height calculated as a summ of difficulties of the each block of the same type (pow or pos) that was before this height
   *  "difficulty" of each block is an adjustment function, difficulty readjusted after every block, 
   *  
   * 
   */
  
    var cumulative_diff = 0;
    var cumulative_diff_adjusted = 0;

    var sequence_factor = 0;
    
    for (let i = 0; i != height; i++) 
    {
      if(blockchain[i].is_pow === is_pow)
      {
        var difficulty_for_i = get_difficulty_for_height(i, !is_pow, blockchain);

        cumulative_diff += difficulty_for_i;
        var sequence_factor = get_sequence_factor_for_height(i, !is_pow, blockchain);
        cumulative_diff_adjusted +=  alter_difficulty_with_sequence_factor(sequence_factor, difficulty_for_i);     
      }
    }

    //Those two lines just to point out that those values are stored in the state, and might be accessed from those variables in other parts
    blockchain[height].cached_cumulative_difficulty = cumulative_diff;
    blockchain[height].cached_cumulative_difficulty_adjusted = cumulative_diff_adjusted;

    return cumulative_diff;
}

/***********************************************************************
 *   FORK CHOICE RULE DEFINITION
 ***********************************************************************/

/**
 * This function helps to find last block of given type at starting from the given height(and directed to genesis, ie decreasing indexes) to access 
 * cumulative_difficulties_adjusted for a given height
 * 
 * @param {*} is_pos     - type of the block to look up, is_pos == true then looking for PoS block, otherwise PoW
 * @param {*} main_chain_starting_height  - starting height to lookup in mainchain
 * @param {*} main_chain - main chain blocks from genesis
 * @param {*} alt_chain   - altchain blocks from split point, if calcuations performed for main chain (A), then caller put empty array here.
 */
function get_last_entry_of_block_at_given_type_starting_from_given_height(is_pos, blockchain, starting_height)
{
  for (let i = starting_height; i != 0; i--)
  {
    if (blockchain[i].is_pos == is_pos)
    {      
      return blockchain[i];
    }
  }
  return undefined;
}


function get_a_to_b_relative_cumulative_difficulty(difficulty_pos_at_split_point, difficulty_pow_at_split_point, CD_A, CD_B)
{
  // this is formula from page 6 of whitepaper 1.2:  https://github.com/hyle-team/docs/blob/master/zano/Zano_WP_latest.pdf

  var basic_sum = CD_A.CD_POW + (CD_A.CD_POS * difficulty_pow_at_split_point) / difficulty_pos_at_split_point;

  var K_pow_a_b = CD_A.CD_POW/CD_B.CD_POW;
  var K_pos_a_b = CD_A.CD_POS/CD_B.CD_POS;

  var res = K_pow_a_b * K_pos_a_b * basic_sum;

  return res;
}

function get_a_to_b_relative_cumulative_difficulty_hard_fork6(difficulty_pos_at_split_point, difficulty_pow_at_split_point, CD_A, CD_B)
{
  // this is formula from page 2 of proposal:  https://github.com/hyle-team/docs/blob/master/zano/Zano_consensus_Improvement_proposal_2.2.pdf

  var basic_sum = CD_A.CD_POW + (CD_A.CD_POS * difficulty_pow_at_split_point) / difficulty_pos_at_split_point;

  var K_pow_a_b = CD_A.CD_POW/CD_B.CD_POW;
  var K_pos_a_b = CD_A.CD_POS/CD_B.CD_POS;

  var res = (K_pow_a_b * K_pos_a_b)/(basic_sum * basic_sum);

  return res;
}

function is_in_hardfork_6_zone()
{
  //this function define if we are in new consensus zone (hardfork_6) or not
}


//this function calculate the lengh of subchains from split point and to the last block in every subchain(A and B) and return minimal lengh 
function get_split_depth(main_chain, altchain, connection_point_height)
{
  var mainchain_subchain_len = main_chain.length - connection_point_height;
  var maltchain_subchain_len = altchain.length - connection_point_height;
  return mainchain_subchain_len > maltchain_subchain_len ? maltchain_subchain_len:mainchain_subchain_len;
}


/**
 * is_reorganize_required is a key function, basically it define consensus algorithm by introducing bunch of rules on how subchains are chosen  
 * 
 * 
 * @param {*} main_chain - this main chain sequence of 'block_entry' structures from genesis
 * 
 * @param {*} alt_chain - this is an alternative chain, in which genesis and most of it's blocks are the same as in main, but the tail of this vector is represent alternative 
 
* @param {*} connection_point_height - last common block between main and alt chains
 */

const POS_PRIORITY_PERIOD = 50; //this constat is subject for consideration, could be between 20 to 100

function is_reorganize_required(main_chain, alt_chain, connection_point_height)
{

  var difficulty_pos_at_split_point = get_difficulty_for_height(connection_point_height, false, main_chain);
  var difficulty_pow_at_split_point = get_difficulty_for_height(connection_point_height, true, main_chain);

  //this variable would hold amount of cumulative work(both POW and POS) that had been done in main chain (A) from the split point to latest block(cumulative difficulty delta)
  var CD_A = {CD_POW: 0, CD_POS: 0}; 
  //this variable would hold amount of cumulative work(both POW and POS) that had been done in alternative chain (B) from the split point to latest block(cumulative difficulty delta)
  var CD_B = {CD_POW: 0, CD_POS: 0}; 

  var main_CD_PoS_end = get_last_entry_of_block_at_given_type_starting_from_given_height(true, main_chain, main_chain.length - 1).cumulative_diff_adjusted;
  var main_CD_PoS_begin = get_last_entry_of_block_at_given_type_starting_from_given_height(true, main_chain, connection_point_height).cumulative_diff_adjusted;
  CD_A.CD_POS = main_CD_PoS_end - main_CD_PoS_begin;

  var main_CD_PoW_end = get_last_entry_of_block_at_given_type_starting_from_given_height(false, main_chain, main_chain.length - 1).cumulative_diff_adjusted;
  var main_CD_PoW_begin = get_last_entry_of_block_at_given_type_starting_from_given_height(false, main_chain, connection_point_height).cumulative_diff_adjusted;
  CD_A.CD_POW = main_CD_PoW_end - main_CD_PoW_begin;

  var alt_CD_PoS_end = get_last_entry_of_block_at_given_type_starting_from_given_height(true, alt_chain, alt_chain.length - 1).cumulative_diff_adjusted;
  var alt_CD_PoS_begin = get_last_entry_of_block_at_given_type_starting_from_given_height(true, alt_chain, connection_point_height).cumulative_diff_adjusted;
  CD_A.CD_POS = alt_CD_PoS_end - alt_CD_PoS_begin;
  alt_cumul_diff.pos_diff = alt_pos_diff_end - alt_pos_diff_begin;
  
  var alt_CD_PoW_end = get_last_entry_of_block_at_given_type_starting_from_given_height(false, alt_chain, alt_chain.length - 1).cumulative_diff_adjusted;
  var alt_CD_PoW_begin = get_last_entry_of_block_at_given_type_starting_from_given_height(false, alt_chain, connection_point_height).cumulative_diff_adjusted;
  CD_A.CD_POW = alt_CD_PoW_end - alt_CD_PoW_begin;

  if(is_in_hardfork_6_zone())
  {
    if(get_split_depth(main_chain, alt_chain, connection_point_height) > POS_PRIORITY_PERIOD)
    {
      //if the split is happenes during short period of time let's prioritize PoS block to prevent "Balancing attack"
      if(CD_A.CD_POS > CD_B.CD_POS)
      {
        return false;
      }
      else if(CD_A.CD_POS < CD_B.CD_POS)
      {
        return true;
      }else{
        //in case of cumulative work of PoS is equal we can rely on PoW
        if(CD_A.CD_POW > CD_B.CD_POW)
        {
          return false;
        }
        else if(CD_A.CD_POS < CD_B.CD_POS)
        {
          return true;
        }else
        {
          //this can happen if the altchain is just 1 block lenght
          return select_forks_with_equal_work(main_chain, alt_chain);
        }
      }
    }
    
    alt = get_a_to_b_relative_cumulative_difficulty_hard_fork6(difficulty_pos_at_split_point, difficulty_pow_at_split_point, CD_B, CD_A);
    main = get_a_to_b_relative_cumulative_difficulty_hard_fork6(difficulty_pos_at_split_point, difficulty_pow_at_split_point, CD_A, CD_B);  
  }else
  {
    alt = get_a_to_b_relative_cumulative_difficulty(difficulty_pos_at_split_point, difficulty_pow_at_split_point, CD_B, CD_A);
    main = get_a_to_b_relative_cumulative_difficulty(difficulty_pos_at_split_point, difficulty_pow_at_split_point, CD_A, CD_B);  
  }

  if (main < alt)
    return true;
  else if (main > alt)
    return false;
  else
  {
    //this can happen if the altchain is just 1 block lenght
    return select_forks_with_equal_work(main_chain, alt_chain);
  }
}

function select_forks_with_equal_work(main_chain, alt_chain)
{
      //this can happen if the altchain is just 1 block lenght
    
    //because we burn fees, we prefer blocks with more summary fee, to motivate stakers include transactions

    if (alt_chain[alt_chain.length -1].total_fees > main_chain[main_chain.length - 1].total_fees)
    {
      return true;
    }else if (alt_chain[alt_chain.length -1].total_fees < main_chain[main_chain.length - 1].total_fees)
    {
      return false;
    }else
    {
      if (!main_chain[main_chain.length - 1].is_pos)
        return false; // do not reorganize on the same cummul diff if it's a PoW block
  

      //in case of simultaneous PoS blocks are happened on the same height (quite common for PoS) 
      //we also try to weight them to guarantee consensus in network between competing blocks by binary comparing stake_hash

      if (memcmp(main_chain[main_chain.length - 1].kernel_hash, alt_chain[alt_chain.length -1].kernel_hash) >= 0)
        return false;
  
      return true;
    }
}

/***********************************************************************
 *   General block validation and building PoS Block's kernel
 ***********************************************************************/

function serialize_block_to_bytes(block)
{
  //this serialization is something similar nature as boost::serialization, 
  //but handmade due to desired determenistic nature of the binary product

  //all data members of block are included in serialization
  return array_of_bytes;
}

function get_block_id(block)
{
  var bytes = serialize_block_to_bytes(block);
  return sha3(bytes);
}

function is_pos_block(block)
{
  //this function can figure out by analizing mining_tx inputs if block is PoS or it's PoW
}

const CURRENCY_BLOCK_FUTURE_TIME_LIMIT =  60*60*2;
const CURRENCY_POS_BLOCK_FUTURE_TIME_LIMIT =  60*20;
const BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW = 60;

function get_last_n_blocks_timestamps(number_of_items, blockchain)
{
  timestamps = [];
  for (let i = blockchain.length - 1; i >= 0; i--) {
    // Add the item to 'last100'
    timestamps.push(blockchain[i].block.timiestamp);
  
    if (timestamps.length === number_of_items) {
      break;
    }
  }
}

function verify_timestamps(block, blockchain)
{
  if(block.timestamp > get_local_time() + CURRENCY_BLOCK_FUTURE_TIME_LIMIT)
  {
    //block timestamp can't be in future for more then 2 hours
    return false;
  }
  
  if (is_pos_block(block) && block.timestamp > get_local_time() + CURRENCY_POS_BLOCK_FUTURE_TIME_LIMIT)
  {
    //PoS block timestamp can't be in future for more then 20 minutes
    return false;
  }
    
  
    
  //we need to protect against timestap being in the past in a deterministic way, 
  //so for that reason we use as minimal allowed timistamp in the past as a median of timestmaps of last 60 blocks
  var timestamps = get_last_n_blocks_timestamps(BLOCKCHAIN_TIMESTAMP_CHECK_WINDOW, blockchain);
  var median_timestamp = median(timestamps);
  if(block.timestamp < median_timestamp)
  {    
    return false;
  }

  return true;
}

/**
 * 
 C++ structure of the block


  struct block_header
  {
    uint8_t major_version;
    uint8_t minor_version;
    uint64_t timestamp;
    crypto::hash  prev_id;
    uint64_t nonce;
    uint8_t flags;

    BEGIN_SERIALIZE()
      FIELD(major_version)
      if(major_version > CURRENT_BLOCK_MAJOR_VERSION) return false;
      FIELD(nonce)
      FIELD(prev_id)
      VARINT_FIELD(minor_version)
      VARINT_FIELD(timestamp)
      FIELD(flags)
    END_SERIALIZE()
  };

  struct block: public block_header
  {
    transaction miner_tx;
    std::vector<crypto::hash> tx_hashes;
    
    BEGIN_SERIALIZE_OBJECT()
      FIELDS(*static_cast<block_header *>(this))
      FIELD(miner_tx)
      FIELD(tx_hashes)
    END_SERIALIZE()
  };
 */

function get_txs_tree_hash(block)
{
  var blob_of_all_hashes; //buffer that accumulate all hashes into one single buffer
  blob_of_all_hashes.append(get_tx_hash(block.miner_tx)); //keep in mind that get_tx_hash doesn't include tx signature/proofs inside tx_hash (works similar as SegWit in bitcoin)
  for(tx_hash in block.tx_hashes)
  {
    blob_of_all_hashes.append(tx_hash);
  }
  return sha3(blob_of_all_hashes);
  //this function actually concatinate all hashes that present in the list tx_hashes and then take hash from 
}

function serialize(struct)
{
  //this function just put all memebrs from BEGIN_SERIALIZE/END_SERIALIZE map and copy it to buffer
}

function get_block_hashing_blob()
{
  var serializaed_header = serialize(block.header);
  var txs_tree_hash = get_txs_tree_hash(block);

  var blob; //just a buffer that accumulate all data for hashing
  blob.append(serializaed_header);
  blob.append(txs_tree_hash);
  blob.append(block.tx_hashes.length);

  return blob;
}

function get_PoW_hash(block)
{
  //we use modification of ethereum ProgPoW, block hashed completly, and this hash is checked against difficulty
  var blob_to_hash = get_block_hashing_blob(block);
  return progpow_hash(blob_to_hash);  
}

function check_hash(proof_hash, difficulty)
{
  //traditionally this called "target"
  var target = (max_hash/difficulty);

  if(proof_hash > target)
    return false;
  
  return true;
}

function is_key_image_spent(key_image)
{
  //keyimages is a fundamental protection against doublespend in cryptonote protocols, more about that could be read in CryptoNote whitepaper 
  //https://academy.bit2me.com/wp-content/uploads/2021/05/MONERO-WHITEPAPER.pdf
  //every input in transaction reveal key_image(that only owner can calculate, but validate can everyone) of corresponding output that is being spent, 
  //core check validity of the keyimage, and also add this keyimage to global set of spent keyimages, so it can't be spent second time
  //if this key image already present in this set of key images then function return false;
}

function get_n_bit_from_32_bytes(bit_index, word_of_32_bytes)
{
  //we assume that this function extract one of 256 bits located at offset  of "bit_index" in "word_of_32_bytes" in a form of bool
  return true;
}

function build_stake_modifier_for_block_hard_fork6(blockchain, block)
{  
  
  var last_pos_block_entry = get_last_entry_of_block_at_given_type_starting_from_given_height(true, blockchain.length - 1, blockchain, []);
  
  //we'll use it as an array of bool to simplify the code, but in real code it would be a bits in 256-wide word (32 bytes)
  var pow_bits = [];
  
  var last_known_pow_index = undefined;
  for(var i = blockchain.length -1; i != 0 && pow_bits.length < 256 ; i--)
  {
    if(blockchain[i].is_pos)
    {
      if(last_known_pow_index !== undefined)
      {
        //get a bit from a pseudorandom position derived from last_pos_block_entry.kernel_hash from PoW block that followed PoS 
        //see page 5-6 of https://github.com/hyle-team/docs/blob/master/zano/Zano_consensus_Improvement_proposal_2.2.pdf 
        //get bit index fist:
        const buffer1 = Buffer.from(last_pos_block_entry.kernel_hash);
        const buffer2 = Buffer.from(pow_bits.length);
        var bit_pos = sha3(Buffer.concat([buffer1, buffer2])) % 256; 
        pow_bits.push_back(get_n_bit_from_32_bytes(bit_pos, last_known_pow_index[last_known_pow_index].hash));
        last_known_pow_index = undefined;
      }
    }else
    {
      last_known_pow_index = i;
    }
  }  

  var stake_modifier = 
  {
    //256 bits from last different pow blocks
    last_pow_bits: pow_bits,
    //last pos block hash
    last_pos_kernel_id: last_pos_block_entry.kernel_hash
  };

  var stake_modifier_contex =
  {
    stake_modifier: stake_modifier, 
    last_pos_block_entry: last_pos_block_entry, 
    last_pow_block_entry: last_pow_block_entry
  }

  return stake_modifier_contex;

}


function build_stake_modifier_for_block(blockchain, block)
{

  var last_pos_block_entry = get_last_entry_of_block_at_given_type_starting_from_given_height(true, blockchain.length - 1, blockchain, []);
  var last_pow_block_entry = get_last_entry_of_block_at_given_type_starting_from_given_height(false, blockchain.length - 1, blockchain, []);

  var stake_modifier = 
  {
    //last pow block
    last_pow_id: get_block_id(last_pow_block_entry.block),
    //last pos block
    last_pos_kernel_id: last_pos_block_entry.kernel_hash
  };

  var stake_modifier_contex =
  {
    stake_modifier: stake_modifier, 
    last_pos_block_entry: last_pos_block_entry, 
    last_pow_block_entry: last_pow_block_entry
  }

  return stake_modifier_contex;
}


function get_block_height_of_tx_intput(input)
{
  //Assume that this function finds the block height at which the original transaction, referenced by the given input, is included.
}

const POS_SCAN_STEP = 15;
function validate_PoS_block(block, blockchain)
{
  //Time quantization is implemented so that staking does not become a computationally complex 
  if(block.timestamp%POS_SCAN_STEP !== 0 )
    return undefined;

  //first input in miner_tx contain block height, second input contain "coin" that won a chance to create a block.
  var staked_keyimage = get_key_image_from_tx_input(block.miner_tx.inputs[1]);

  //check against double spend
  if(is_key_image_spent(staked_keyimage))
    return undefined;

  ////////////////////////////////////////////////////////////////////////////////
  //building stake kernel, quite essential structure for PoS part
  ////////////////////////////////////////////////////////////////////////////////
  
  var stake_modifier = 
  {
    last_pow_id: "",
    last_pos_kernel_id: ""
  };

  var stake_kernel =
  {
    stake_modifier: stake_modifier,
    block_timestamp: block.timestamp,             //this block timestamp
    kimage: staked_keyimage 
  };

  if(is_in_hardfork_6_zone())
    var stake_modifier_context = build_stake_modifier_for_block_hard_fork6(block, blockchain);
  else
    var stake_modifier_context = build_stake_modifier_for_block(block, blockchain);
  

  //staked tx should be behind(with smaller height) latest PoW block
  if(get_block_height_of_tx_intput(block.miner_tx.inputs[1]) >= stake_modifier_context.last_pow_block_entry.height)
  {
    return undefined;
  }

  //minimal coinage should be 10 confirmations only
  if(get_block_height_of_tx_intput(block.miner_tx.inputs[1]) > blockchain.length - 11)
  {
    return undefined;
  }
    

  stake_kernel.stake_modifier = stake_modifier_context.stake_modifier;
  kernel_hash = sha3(stake_kernel);

  return kernel_hash;
}

function verify_block_and_create_entry(block, blockchain)
{
  if(!verify_timestamps(block, blockchain))
  {
    return undefined;
  }

  var proof_hash = undefined;
  var is_pos = is_pos_block(block);
  var current_difficulty = get_difficulty_for_height(blockchain.length, !is_pos, blockchain);
  if(!is_pos)
  {
    //validate PoW difficulty
    proof_hash = get_PoW_hash(block);
    if(!check_hash(hash, current_difficulty))
    {
      //block doesn't much the expected difficulty
      return undefined;
    }
  }else
  {
    //validate PoS block
    proof_hash = validate_PoS_block(block, blockchain);
    if(proof_hash === undefined)
    {
      //failed to validate PoS block
      return undefined;
    }
    //in Zarcanum era (after HF4) amount is hidden, and similar calculations are hidden behind bulletproofs
    //but for simplicity we'll bring here an amout as open number, since in terms of consensus algo it holds the same idea
    //lets pretend that block.miner_tx.inputs[1].amount hold amount of the output that was chosen to create a block
    //weight difficulty to amout:
    var current_difficulty_weighted = current_difficulty / block.miner_tx.inputs[1].amount;
    if(!check_hash(proof_hash, current_difficulty_weighted))
    {
        //block doesn't much the expected difficulty
        return undefined;
    }
  }

  var sequence_factor = get_sequence_factor_for_height(blockchain.length, is_pos, blockchain);
  var current_diff_adjusted =  alter_difficulty_with_sequence_factor(sequence_factor, current_difficulty);     

  var last_x_block_entry = get_last_entry_of_block_at_given_type_starting_from_given_height(is_pos, blockchain.length - 1, blockchain, []);


  var block_entry = {
    block: block, 
    height: blockchain.length,
    is_pos: is_pos, 
    hash: get_block_id(block),
    cached_difficulty: current_difficulty,
    cached_cumulative_difficulty: last_x_block_entry.cached_cumulative_difficulty + current_difficulty,    
    cached_cumulative_difficulty_adjusted: last_x_block_entry.cached_cumulative_difficulty_adjusted + current_diff_adjusted, 
    kernel_hash: is_pos ? proof_hash:undefined
  }
  return block_entry;
}

function get_local_time()
{
  //just get local clock linux timestamp
}

function build_chain_for_alternative_block()
{
  //if it was possible to find subchain of alternative blocks that have connection to main chain, then it retruns 
  //vector of blocks, starting from genesis, 
  //otherwise returned undefined;
  return {
    alt_chain,                //alternative chain of blocks starting from genesis 
    connection_point_height   //last block that is common for main chain and alt chain
  };
}

function handle_new_block(block)
{

  /**
   * Here we assume that there is a storage of main blocks, called blockchain_main, and also a pool of alternative blocks(alt_blocks_pool)
   * that was stored in the full node, if those block was succesefully validated with network rules.
   * 
   */
  blockchain = undefined;
  var is_alternative_block = false;
  var context_althcain = undefined;
  if(block.prev_id == get_block_id(blockchain[blockchain.length - 1].block))
  {
    //block added to main chain
    blockchain = blockchain_main;
  }else
  {
    //block is "alternative", potential candidate to swithch node to this block and it's subchain 
    //to simplify validation process definiton here in this example, we assume that there is a function that 
    //simply create full vector of blocks that ended with this alternative block, and might include some other alternative 
    //blocks in the tail, but start from the very begining, from genesis. In real code it's done in a more effective way, but practically 
    //doing the same job in terms of validation
    context_althcain = build_chain_for_alternative_block(block);
    if(blockchain === undefined)
    {
      //invalid alternative block, likely not found connection to main chain
      return false;
    } 
    blockchain = context_althcain.alt_chain;
    is_alternative_block = true;
  }

  var block_entry = verify_block(block, blockchain);

  if(block_entry === undefined)
  {
    //failed to verify block
    return false;
  }

  if(is_alternative_block)
  {

    make_altchain_as_ //TODO: simplify code with altchain to main chain may be?

    // this is key part, where decision about chain swithcing are made
    if(is_reorganize_required(blockchain_main, context_althcain.connection_point_height))
    {
      //THIS MEANS THAT SUBCHAIN IS TAKING OVER
      //in real code this part pop all blocks from the main chain until context_althcain.connection_point_height
      //and put those blocks to the pool of alternative blocks, and put blocks from context_althcain.alt_chain starting after 
      //context_althcain.connection_point_height to main chain vector       
    }else
    {
      //add block entry to alternative blocks pool, for future alt blocks processing
    }
  }else{
    blockchain_main.push_back(block_entry);
  }
  return true;

}



