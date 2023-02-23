'use strict';
const API = 'https://xen.bitdeep.dev';
const CONTRACTS = {
    2221: {
        contract: "0x80380F7EaCBC929E83414b59ccF1393430FF74E2",
        label: "KAVA (testnet)",
        currency: "tKAVA",
        rpc: "https://evm.testnet.kava.io",
        explorer: "https://explorer.testnet.kava.io"
    },
    97: {
        contract: "0x85FFc3610331F1D95d565252A68cd423Be9d58A9",
        label: "BSC (testnet)",
        currency: "tBSC",
        rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
        explorer: "https://testnet.bscscan.com"
    }

};

let web3, account, src, CONTRACT, srcChainId;
let currentPage;

function showPage(id) {
    currentPage = id;
    $('#area_connect').hide();
    $('#area_dashboard').hide();
    $(`#${id}`).show();
}

async function show_connect() {
    showPage('area_connect');
}

async function app_connect(){
    await connect();
    await show_dashboard();
}
async function connect() {
    if (window.ethereum) {
        const r = await window.ethereum.request({method: "eth_requestAccounts"});
        web3 = new Web3(window.ethereum);
        account = r[0];
        srcChainId = await web3.eth.getChainId();
        console.log('connect', account, srcChainId);
        CONTRACT = CONTRACTS[srcChainId];

        window.ethereum.on('accountsChanged', connect);
        window.ethereum.on('chainChanged', connect);

        $('#global_alert').hide();

        if (!CONTRACT) {
            let chainsNames = [];
            for (let chainId in CONTRACTS) {
                const r = CONTRACTS[chainId];
                chainsNames.push(r.label);
            }
            const errmsg = `Error: the chain ${srcChainId} is not supported by Vara. Supported chains are: ` + chainsNames.join(', ');
            $('#global_alert').html(errmsg);
            $('#global_alert').show();
        } else {
            const errmsg = `<div class="alert alert-success" role="alert">
                            Wait, loading ${CONTRACT.label} stats...
                            </div>`;
            $('#area_connect_text').html(errmsg);
            $('#area_connect_text').show();
            await initContract();
        }
    } else {
        const errmsg = `<div class="alert alert-danger" role="alert">
                            Error: metamask not detected.
                            </div>`;
        $('#area_connect_text').html(errmsg);

        await show_connect();
    }
}


let airdropData;
async function show_dashboard() {
    if (!account) return alert(`You are not connected. Connect your wallet first.`);
    $('#btn-claim').hide();
    showPage('area_dashboard');
    // ---

    $('#global_alert').html(`Checking if ${account} is eligible...`);
    $('#global_alert').show();

    const uri = `${API}/proof/${account}`;
    console.log('api', uri);
    let res = await fetch(uri);
    airdropData = await res.json();
    console.log('airdropData', airdropData);



    if( ! airdropData.value ){
        $('#global_alert').html(`Account ${account} not eligible for claiming the airdrop.`);
    }else{
        const v = web3.utils.fromWei(airdropData.value);
        $('#global_alert').html(`Account ${account} eligible for claiming ${v} VARA. Checking if already claimed...`);
        const hasClaimed = await src.methods.hasClaimed(account).call();
        if( hasClaimed === true ){
            $('#global_alert').html(`Account ${account} already claimed the airdrop. Thank you.`);
        }else{
            $('#global_alert').html(`Account ${account} eligible for claiming the airdrop of ${v} VARA.`);
            $('#btn-claim').show();
        }
    }

}


async function initContract() {
    console.log('initContract')
    if (!CONTRACT) {
        let chainsNames = [];
        for (let chainId in CONTRACTS) {
            const r = CONTRACTS[chainId];
            chainsNames.push(r.label);
        }
        let warningHtml = 'Error: chain not supported. Supported chains are: ' + chainsNames.join(', ');
        $('#global_alert').html(warningHtml);
        console.log('initContract 2')
        $('#global_alert').show();
        return;
    }
    $('#global_alert').hide();
    src = new web3.eth.Contract(abi_merkleclaim, CONTRACT.contract);
    const proof = (await src.methods.merkleRoot().call());
    console.log('proof', proof);
}

async function claim(){
    try {
        const from = account.toString();
        const claimValue = airdropData.value;
        const claimProof = airdropData.proof;
        console.log('claimProof', claimProof);
        console.log('contract', src._address);
        console.log('claimValue', claimValue);
        console.log('from', from);

        await src.methods.claim(claimValue, claimProof).send({from: from});
        await show_dashboard();
    } catch (error) {
        $('#global_alert').html(`<pre>${error.toString()}</pre>`);
    }
}
