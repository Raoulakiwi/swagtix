const API_BASE_URL = '/api/v1'; // Matches process.env.API_BASE_URL || '/api/v1' from server.js

const statusMessages = document.getElementById('status-messages');
const apiStatusSpan = document.getElementById('api-status');
const walletStatusSpan = document.getElementById('wallet-status');
const walletAddressSpan = document.getElementById('wallet-address');
const walletBalanceSpan = document.getElementById('wallet-balance');
const networkNameSpan = document.getElementById('network-name');
const refreshStatusBtn = document.getElementById('refresh-status');
const contractDeployedInfo = document.getElementById('contract-deployed-info');
const contractDeployForm = document.getElementById('contract-deploy-form');
const deployContractBtn = document.getElementById('deploy-contract-btn');
const deployLoading = document.getElementById('deploy-loading');
const deployedContractAddress = document.getElementById('deployed-contract-address');
const explorerLink = document.getElementById('explorer-link');
const ticketManagementSection = document.getElementById('ticket-management-section');
const mintTicketForm = document.getElementById('mint-ticket-form');
const mintLoading = document.getElementById('mint-loading');
const ticketsList = document.getElementById('tickets-list');
const ticketsLoading = document.getElementById('tickets-loading');
const noTicketsMessage = document.getElementById('no-tickets-message');
const refreshTicketsBtn = document.getElementById('refresh-tickets');

// Show message function
function showMessage(message, type = 'info', timeout = 5000) {
  console.log(`[UI Message] Type: ${type}, Message: ${message}`);
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  statusMessages.appendChild(alertDiv);
  
  if (timeout) {
    setTimeout(() => {
      alertDiv.classList.remove('show');
      setTimeout(() => alertDiv.remove(), 150);
    }, timeout);
  }
}

// Fetch status from API
async function fetchStatus() {
  console.log('Fetching API and wallet status...');
  try {
    // Check API status
    const apiResponse = await fetch('/api/status');
    const apiData = await apiResponse.json();
    console.log('API Status Response:', apiData);
    
    if (apiData.success) {
      apiStatusSpan.textContent = 'Online';
      apiStatusSpan.className = 'badge bg-success';
    } else {
      apiStatusSpan.textContent = 'Error';
      apiStatusSpan.className = 'badge bg-danger';
      showMessage(`Backend API error: ${apiData.message || 'Unknown'}`, 'danger');
    }
    
    // Check wallet status
    const walletResponse = await fetch(`${API_BASE_URL}/wallet/status`);
    console.log('Wallet Status Response:', walletResponse);
    if (walletResponse.ok) {
      const walletData = await walletResponse.json();
      console.log('Wallet Data:', walletData);
      
      if (walletData.success) {
        walletStatusSpan.textContent = 'Connected';
        walletStatusSpan.className = 'badge bg-success';
        walletAddressSpan.textContent = walletData.address;
        networkNameSpan.textContent = walletData.network || 'PulseChain';
        
        // Get wallet balance
        const balanceResponse = await fetch(`${API_BASE_URL}/wallet/balance`);
        const balanceData = await balanceResponse.json();
        console.log('Balance Data:', balanceData);
        
        if (balanceData.success) {
          walletBalanceSpan.textContent = balanceData.balance;
        } else {
          walletBalanceSpan.textContent = 'Error loading balance';
          showMessage(`Failed to load wallet balance: ${balanceData.message || 'Unknown'}`, 'warning');
        }
      } else {
        walletStatusSpan.textContent = 'Error';
        walletStatusSpan.className = 'badge bg-danger';
        walletAddressSpan.textContent = 'Not connected';
        walletBalanceSpan.textContent = 'N/A';
        showMessage(`Wallet connection error: ${walletData.message || 'Unknown'}`, 'danger');
      }
    } else if (walletResponse.status === 503) {
      walletStatusSpan.textContent = 'Not Initialized';
      walletStatusSpan.className = 'badge bg-warning';
      walletAddressSpan.textContent = 'Wallet service not initialized';
      walletBalanceSpan.textContent = 'N/A';
      showMessage('Wallet service not initialized. Check server logs for password issues.',
        'warning');
    } else {
      walletStatusSpan.textContent = 'Error';
      walletStatusSpan.className = 'badge bg-danger';
      walletAddressSpan.textContent = 'Connection failed';
      walletBalanceSpan.textContent = 'N/A';
      showMessage(`Failed to connect to wallet service: ${walletResponse.statusText}`, 'danger');
    }
    
    // Check contract status
    const contractResponse = await fetch(`${API_BASE_URL}/contract/status`);
    console.log('Contract Status Response:', contractResponse);
    
    if (contractResponse.ok) {
      const contractData = await contractResponse.json();
      console.log('Contract Data:', contractData);
      
      if (contractData.success && contractData.isInitialized) {
        contractDeployedInfo.classList.remove('d-none');
        contractDeployForm.classList.add('d-none');
        deployedContractAddress.textContent = contractData.contractAddress;
        
        const explorerUrl = `https://scan.pulsechain.com/address/${contractData.contractAddress}`;
        explorerLink.href = explorerUrl;
        
        // Show ticket management section
        ticketManagementSection.classList.remove('d-none');
        
        // Fetch tickets
        fetchTickets();
      } else {
        contractDeployedInfo.classList.add('d-none');
        contractDeployForm.classList.remove('d-none');
        ticketManagementSection.classList.add('d-none');
      }
    } else if (contractResponse.status === 503) {
      showMessage('Contract service not initialized. Deploy the contract first.', 'warning');
      contractDeployedInfo.classList.add('d-none');
      contractDeployForm.classList.remove('d-none');
      ticketManagementSection.classList.add('d-none');
    } else {
      showMessage(`Failed to check contract status: ${contractResponse.statusText}`, 'danger');
    }
  } catch (error) {
    console.error('Error fetching status:', error);
    apiStatusSpan.textContent = 'Error';
    apiStatusSpan.className = 'badge bg-danger';
    walletStatusSpan.textContent = 'Error';
    walletStatusSpan.className = 'badge bg-danger';
    showMessage(`Failed to connect to backend API: ${error.message}`, 'danger');
  }
}

// Deploy contract
async function deployContract() {
  console.log('Deploying contract...');
  deployContractBtn.disabled = true;
  deployLoading.classList.remove('d-none');
  
  try {
    const response = await fetch(`${API_BASE_URL}/contract/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Contract Deployment Response:', data);
    
    if (data.success) {
      showMessage(`Contract deployed successfully at ${data.data.contractAddress}!`, 'success');
      // Refresh status to update UI
      await fetchStatus();
    } else {
      showMessage(`Failed to deploy contract: ${data.message}`, 'danger');
    }
  } catch (error) {
    console.error('Error deploying contract:', error);
    showMessage(`Error deploying contract: ${error.message}`, 'danger');
  } finally {
    deployContractBtn.disabled = false;
    deployLoading.classList.add('d-none');
  }
}

// Mint ticket
async function mintTicket(event) {
  event.preventDefault();
  console.log('Minting ticket...');
  
  const mintTo = document.getElementById('mintTo').value;
  const mintAmount = document.getElementById('mintAmount').value;
  const eventTimestamp = document.getElementById('eventTimestamp').value;
  const qrCodeUri = document.getElementById('qrCodeUri').value;
  const mediaUri = document.getElementById('mediaUri').value;
  
  const mintBtn = document.getElementById('mint-btn');
  mintBtn.disabled = true;
  mintLoading.classList.remove('d-none');
  
  try {
    const response = await fetch(`${API_BASE_URL}/contract/mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: mintTo,
        amount: parseInt(mintAmount),
        eventTimestamp: parseInt(eventTimestamp),
        qrCodeUri,
        mediaUri
      })
    });
    
    const data = await response.json();
    console.log('Mint Ticket Response:', data);
    
    if (data.success) {
      showMessage(`Successfully minted ${mintAmount} ticket(s) to ${mintTo}!`, 'success');
      // Reset form
      mintTicketForm.reset();
      // Refresh tickets
      await fetchTickets();
    } else {
      showMessage(`Failed to mint ticket: ${data.message}`, 'danger');
    }
  } catch (error) {
    console.error('Error minting ticket:', error);
    showMessage(`Error minting ticket: ${error.message}`, 'danger');
  } finally {
    mintBtn.disabled = false;
    mintLoading.classList.add('d-none');
  }
}

// Fetch tickets
async function fetchTickets() {
  console.log('Fetching tickets...');
  ticketsLoading.classList.remove('d-none');
  noTicketsMessage.classList.add('d-none');
  
  // Clear existing tickets
  const ticketsContainer = document.getElementById('tickets-list');
  while (ticketsContainer.firstChild) {
    if (ticketsContainer.firstChild === ticketsLoading || ticketsContainer.firstChild === noTicketsMessage) {
      break;
    }
    ticketsContainer.removeChild(ticketsContainer.firstChild);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/contract/tickets`);
    const data = await response.json();
    console.log('Tickets Response:', data);
    
    if (data.success) {
      if (data.data && data.data.length > 0) {
        data.data.forEach(ticket => {
          const ticketElement = createTicketElement(ticket);
          ticketsContainer.appendChild(ticketElement);
        });
      } else {
        noTicketsMessage.classList.remove('d-none');
      }
    } else {
      showMessage(`Failed to fetch tickets: ${data.message}`, 'danger');
    }
  } catch (error) {
    console.error('Error fetching tickets:', error);
    showMessage(`Error fetching tickets: ${error.message}`, 'danger');
  } finally {
    ticketsLoading.classList.add('d-none');
  }
}

// Create ticket element
function createTicketElement(ticket) {
  const col = document.createElement('div');
  col.className = 'col-md-4 mb-4';
  
  const now = Math.floor(Date.now() / 1000);
  const isBeforeEvent = ticket.eventTimestamp > now;
  
  col.innerHTML = `
    <div class="ticket-item">
      <h5>Ticket #${ticket.tokenId}</h5>
      <p><strong>Owner:</strong> ${shortenAddress(ticket.owner)}</p>
      <p><strong>Event Date:</strong> ${formatTimestamp(ticket.eventTimestamp)}</p>
      <p><strong>Status:</strong> 
        <span class="badge ${isBeforeEvent ? 'bg-success' : 'bg-secondary'}">
          ${isBeforeEvent ? 'Active' : 'Expired'}
        </span>
      </p>
      <img src="${isBeforeEvent ? ticket.qrCodeUri : ticket.mediaUri}" 
           alt="${isBeforeEvent ? 'QR Code' : 'Event Media'}" 
           class="img-fluid mt-2">
    </div>
  `;
  
  return col;
}

// Helper function to shorten address
function shortenAddress(address) {
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  fetchStatus();
  
  refreshStatusBtn.addEventListener('click', fetchStatus);
  deployContractBtn.addEventListener('click', deployContract);
  mintTicketForm.addEventListener('submit', mintTicket);
  refreshTicketsBtn.addEventListener('click', fetchTickets);
});
