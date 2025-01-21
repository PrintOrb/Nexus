const apiUrl = 'http://localhost:3000/api'; // Base API URL

// Redirect to the home page
function goHome() {
  window.location.href = '/';
}

// Navigation to tickets.html
function goToTickets() {
  window.location.href = '/tickets.html';
}

// Redirect to the database management page
function goToDatabase() {
  window.location.href = '/database.html';
}

// Redirect to the customer details page
function goToCustomerDetails(customerId) {
  window.location.href = `/customers.html?customerId=${customerId}`;
}

// Load all customers into the table (database.html)
async function loadCustomers() {
  const tableBody = document.querySelector('#customerTable tbody');
  tableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

  try {
    const response = await fetch(`${apiUrl}/customers`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const customers = await response.json();
    tableBody.innerHTML = '';

    if (customers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5">No customers found.</td></tr>';
      return;
    }

    customers.forEach(customer => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${customer.id}</td>
        <td>${customer.name}</td>
        <td>${customer.email || 'No email'}</td>
        <td>${customer.phone || 'No phone'}</td>
        <td>
          <button onclick="goToCustomerDetails(${customer.id})">View Details</button>
          <button onclick="deleteCustomer(${customer.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading customers:', error);
    tableBody.innerHTML = '<tr><td colspan="5">Failed to load customers.</td></tr>';
  }
}

// Add a customer (database.html)
async function addCustomer(event) {
  event.preventDefault();

  const name = document.getElementById('customerName').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  let phone = document.getElementById('customerPhone').value.trim();

  // Validate name
  if (!name) {
    alert('Customer name is required.');
    return;
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  // Normalize and validate phone number
  const phoneDigits = phone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
  if (phoneDigits.length !== 10) {
    alert('Phone number must be 10 digits (e.g., 123-555-7890).');
    return;
  }
  phone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;

  try {
    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    alert('Customer added successfully!');
    loadCustomers();
    document.getElementById('addCustomerForm').reset();
  } catch (error) {
    console.error('Error adding customer:', error);
    alert('Failed to add customer.');
  }
}


// Delete a customer (database.html)
async function deleteCustomer(customerId) {
  if (!confirm('Are you sure you want to delete this customer?')) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    alert('Customer deleted successfully!');
    loadCustomers();
  } catch (error) {
    console.error('Error deleting customer:', error);
    alert('Failed to delete customer.');
  }
}

// Load customer details and associated items (customers.html)
async function loadCustomerDetails() {
  const params = new URLSearchParams(window.location.search);
  const customerId = params.get('customerId');

  if (!customerId) {
    alert('Customer ID is missing in the URL.');
    goHome();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const { customer, items } = await response.json();

    const detailsDiv = document.getElementById('customerDetails');
    detailsDiv.innerHTML = `
      <h2>${customer.name || 'Customer Name Not Found'}</h2>
      <p>Email: ${customer.email || 'No email provided'}</p>
      <p>Phone: ${customer.phone || 'No phone number provided'}</p>
      <ul id="itemsList">
        ${items.length > 0
          ? items
              .map(
                item => `
              <li class="item-entry">
                <span>${item.name}</span>
                <button class="remove-button" onclick="removeItem(${item.id}, this)" style="display: none;">X</button>
              </li>
            `
              )
              .join('')
          : '<li>No items associated with this customer.</li>'}
      </ul>
    `;

    // Populate edit form fields with null checks
    const editCustomerName = document.getElementById('editCustomerName');
    if (editCustomerName) {
      editCustomerName.value = customer.name || '';
    }

    const editCustomerEmail = document.getElementById('editCustomerEmail');
    if (editCustomerEmail) {
      editCustomerEmail.value = customer.email || '';
    }

    const editCustomerPhone = document.getElementById('editCustomerPhone');
    if (editCustomerPhone) {
      editCustomerPhone.value = customer.phone || '';
    }

    const editCustomerNotes = document.getElementById('editCustomerNotes');
    if (editCustomerNotes) {
      editCustomerNotes.value = customer.notes || '';
    }
  } catch (error) {
    console.error('Error loading customer details:', error);
    document.getElementById('customerDetails').innerHTML =
      '<p class="error">Failed to load customer details.</p>';
  }
}


// Search for customers based on query
async function searchCustomers() {
  const query = document.getElementById('searchBar').value.trim();
  if (!query) {
    alert('Please enter a search query.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/customers/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const results = await response.json();

    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';

    if (results.length === 0) {
      resultsDiv.textContent = 'No results found.';
      return;
    }

    results.forEach(customer => {
      const resultItem = document.createElement('div');
      resultItem.innerHTML = `
        <strong>${customer.name}</strong> - ${customer.email || 'No email'}, ${customer.phone || 'No phone'}
        <button onclick="goToCustomerDetails(${customer.id})">View Details</button>
      `;
      resultsDiv.appendChild(resultItem);
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    alert('Failed to search customers.');
  }
}

// Save the search query to session storage
document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    const savedQuery = sessionStorage.getItem('searchQuery');
    if (savedQuery) {
      searchBar.value = savedQuery;
      searchCustomers(); // Automatically perform the search
    }

    searchBar.addEventListener('input', () => {
      sessionStorage.setItem('searchQuery', searchBar.value);
    });
  }
});

// Clear the search bar and results
document.addEventListener('DOMContentLoaded', () => {
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    searchBar.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default form submission behavior
        searchCustomers(); // Call the search function
      }
    });
  }
});

// Toggle the visibility of the edit form
function toggleEditForm() {
  const editContainer = document.getElementById('editCustomerContainer');
  const editButton = document.getElementById('editToggleButton');
  const removeButtons = document.querySelectorAll('.remove-button');

  if (editContainer.style.display === 'none') {
    editContainer.style.display = 'block';
    editButton.textContent = 'Cancel';

    // Show all "X" buttons
    removeButtons.forEach(button => {
      button.style.display = 'inline-block';
    });
  } else {
    editContainer.style.display = 'none';
    editButton.textContent = 'Edit';

    // Hide all "X" buttons
    removeButtons.forEach(button => {
      button.style.display = 'none';
    });
  }
}

// Add item to customer (customers.html)
async function addItem(event) {
  event.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const customerId = params.get('customerId');
  const itemName = document.getElementById('itemName').value.trim();

  if (!customerId || !itemName) {
    alert('Customer ID or Item Name is missing.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: itemName }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    alert('Item added successfully!');
    document.getElementById('addItemForm').reset();
    loadCustomerDetails();
  } catch (error) {
    console.error('Error adding item:', error);
    alert('Failed to add item.');
  }
}

// Remove item from customer (customers.html)
async function removeItem(itemId, buttonElement) {
  if (!confirm('Are you sure you want to remove this item?')) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/items/${itemId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    alert('Item removed successfully!');
    buttonElement.parentElement.remove();
  } catch (error) {
    console.error('Error removing item:', error);
    alert('Failed to remove item.');
  }
}

// Update customer details (customers.html)
async function updateCustomer(event) {
  event.preventDefault();

  const params = new URLSearchParams(window.location.search);
  const customerId = params.get('customerId');
  const name = document.getElementById('editCustomerName').value.trim();
  const email = document.getElementById('editCustomerEmail').value.trim();
  const phone = document.getElementById('editCustomerPhone').value.trim();
  const notes = document.getElementById('editCustomerNotes').value.trim();

  if (!customerId || !name) {
    alert('Customer ID or Name is missing.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, notes }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    alert('Customer updated successfully!');

    // No longer clearing the notes field to ensure notes remain visible
    toggleEditForm();
    loadCustomerDetails();
  } catch (error) {
    console.error('Error updating customer:', error);
    alert('Failed to update customer.');
  }
}

// Toggle the visibility of the edit form
function toggleEditForm() {
  const editContainer = document.getElementById('editCustomerContainer');
  const editButton = document.getElementById('editToggleButton');
  const removeButtons = document.querySelectorAll('.remove-button');

  // Toggle edit form visibility
  if (editContainer.style.display === 'none') {
    editContainer.style.display = 'block';
    editButton.textContent = 'Cancel';

    // Show all delete buttons
    removeButtons.forEach(button => {
      button.style.display = 'inline-block';
    });
  } else {
    editContainer.style.display = 'none';
    editButton.textContent = 'Edit';

    // Hide all delete buttons
    removeButtons.forEach(button => {
      button.style.display = 'none';
    });
  }
}

// Fetch tickets from the backend
async function loadTickets() {
  console.log('Calling loadTickets function...');

  const tableBody = document.querySelector('#ticketList tbody');
  if (!tableBody) {
    console.error('Table body not found!');
    return;
  }

  console.log('Found table body, starting fetch request...');

  try {
    const response = await fetch(`${apiUrl}/tickets`);
    console.log('Fetch request completed. Response status:', response.status);

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const tickets = await response.json();
    console.log('Tickets fetched:', tickets);

    tableBody.innerHTML = ''; // Clear loading message

    if (tickets.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6">No tickets found.</td></tr>';
      return;
    }

    tickets.forEach(ticket => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ticket.id}</td>
        <td>${ticket.type}</td>
        <td>${ticket.description}</td>
        <td>${ticket.status}</td>
        <td>${ticket.customer_id || 'N/A'}</td>
        <td>
          <button onclick="viewTicket(${ticket.id})">View</button>
          <button onclick="deleteTicket(${ticket.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error during loadTickets execution:', error);
    tableBody.innerHTML = '<tr><td colspan="6">Failed to load tickets.</td></tr>';
  }
}

// Load tickets with filters
async function loadTickets(filters = {}) {
  console.log('Fetching tickets...');
  const tableBody = document.querySelector('#ticketList tbody');
  tableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

  try {
    // Construct query parameters for filtering
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${apiUrl}/tickets?${queryParams}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const tickets = await response.json();
    console.log('Fetched tickets:', tickets);

    tableBody.innerHTML = ''; // Clear loading message

    if (tickets.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6">No tickets found.</td></tr>';
      return;
    }

    tickets.forEach(ticket => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ticket.id}</td>
        <td>${ticket.type}</td>
        <td>${ticket.description}</td>
        <td>${ticket.status}</td>
        <td>${ticket.customer_id || 'N/A'}</td>
        <td>
          <button onclick="viewTicket(${ticket.id})">View</button>
          <button onclick="deleteTicket(${ticket.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading tickets:', error);
    tableBody.innerHTML = '<tr><td colspan="6">Failed to load tickets.</td></tr>';
  }
}

// View ticket notes
async function viewTicket(ticketId) {
  console.log('Viewing ticket ID:', ticketId); // Debug log
  try {
    const response = await fetch(`${apiUrl}/tickets/${ticketId}/notes`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const notes = await response.json();
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = ''; // Clear existing notes

    if (notes.length === 0) {
      notesList.innerHTML = '<li>No notes available for this ticket.</li>';
    } else {
      notes.forEach(note => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <span>${note.note}</span>
          <small>${new Date(note.created_at).toLocaleString()}</small>
        `;
        notesList.appendChild(listItem);
      });
    }

    openNotesModal();
  } catch (error) {
    console.error('Error loading ticket notes:', error); // Log any error
    alert('Failed to load ticket notes.');
  }
}

// Open the ticket notes modal
function openNotesModal() {
  const modal = document.getElementById('ticketNotesModal');
  modal.style.display = 'flex';
}

function closeNotesModal() {
  const modal = document.getElementById('ticketNotesModal');
  modal.style.display = 'none';
}

// Load tickets (customers.html)
async function loadCustomerTickets(customerId) {
  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}/tickets`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const tickets = await response.json();
    const openTickets = tickets.filter(ticket => ticket.status === 'open');
    const pastTickets = tickets.filter(ticket => ticket.status !== 'open');

    const summary = document.getElementById('openTicketsSummary');
    const openTicketsList = document.getElementById('openTicketsList');
    const viewTicketsButton = document.getElementById('viewTicketsButton');

    // Clear existing tickets
    openTicketsList.innerHTML = '';

    if (openTickets.length > 0) {
      summary.textContent = `This customer has ${openTickets.length} open ticket(s):`;
      openTicketsList.innerHTML = openTickets
        .map(ticket => `<li>${ticket.description}</li>`)
        .join('');
      viewTicketsButton.textContent = 'View Open Tickets';
      viewTicketsButton.onclick = () => showTicketNotes(openTickets[0].id);
    } else {
      summary.textContent = 'This customer has no open tickets.';
      openTicketsList.innerHTML = pastTickets
        .map(ticket => `<li>${ticket.description}</li>`)
        .join('');
      viewTicketsButton.textContent = 'View Previous Tickets';
      viewTicketsButton.onclick = () => showTicketNotes(pastTickets[0]?.id || null);
    }

    // Show the button if there are any tickets
    viewTicketsButton.style.display = tickets.length > 0 ? 'block' : 'none';
  } catch (error) {
    console.error('Error loading customer tickets:', error);
    document.getElementById('openTicketsSummary').textContent =
      'Failed to load tickets for this customer.';
  }
}

// Display tickets in a modal
async function showTicketNotes(ticketId) {
  if (!ticketId) {
    alert('No ticket selected.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/tickets/${ticketId}/notes`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const notes = await response.json();
    const notesContainer = document.getElementById('ticketNotesContainer');
    const notesList = document.getElementById('ticketNotesList');
    const notesTitle = document.getElementById('ticketNotesTitle');

    // Clear existing notes
    notesList.innerHTML = '';

    if (notes.length === 0) {
      notesList.innerHTML = '<li>No notes available for this ticket.</li>';
    } else {
      notes.forEach(note => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <p>${note.note}</p>
          <small>Created on: ${new Date(note.created_at).toLocaleString()}</small>
        `;
        notesList.appendChild(listItem);
      });
    }

    // Update the title and show the notes container
    notesTitle.textContent = `Notes for Ticket #${ticketId}`;
    notesContainer.style.display = 'block';
  } catch (error) {
    console.error('Error loading ticket notes:', error);
    alert('Failed to load ticket notes.');
  }
}

// Close the ticket notes modal
function displayTickets(tickets) {
  const openTicketsList = document.getElementById('openTicketsList');

  // Update the list to show the tickets
  openTicketsList.innerHTML = '';

  if (tickets.length === 0) {
    openTicketsList.innerHTML = '<li>No tickets to display.</li>';
  } else {
    tickets.forEach(ticket => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <strong>${ticket.type}</strong>: ${ticket.description} (Created on: ${new Date(
        ticket.created_at
      ).toLocaleDateString()})
        <button onclick="showTicketNotes(${ticket.id})">View Notes</button>
      `;
      openTicketsList.appendChild(listItem);
    });
  }
}

// View past tickets for the customer
function viewPastTickets() {
  const summary = document.getElementById('openTicketsSummary');
  const openTicketsList = document.getElementById('openTicketsList');

  // Clear current tickets and show a message
  summary.textContent = 'Displaying past tickets:';
  openTicketsList.innerHTML = `
    <li><em>Feature under construction, but this is where past tickets will appear.</em></li>
  `;
}

// load customer details and associated items (customers.html)
async function loadCustomerDetails() {
  const params = new URLSearchParams(window.location.search);
  const customerId = params.get('customerId');

  if (!customerId) {
    alert('Customer ID is missing in the URL.');
    goHome();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const { customer } = await response.json();
    console.log('Customer Data:', customer);

    const detailsDiv = document.getElementById('customerDetails');
    if (!detailsDiv) {
      console.error('customerDetails element not found in the DOM.');
      return;
    }

    detailsDiv.innerHTML = `
      <h2>${customer.name || 'Customer Name Not Found'}</h2>
      <p>Email: ${customer.email || 'No email provided'}</p>
      <p>Phone: ${customer.phone || 'No phone number provided'}</p>
    `;

    // Load customer tickets
    loadCustomerTickets(customerId);
  } catch (error) {
    console.error('Error loading customer details:', error);

    const detailsDiv = document.getElementById('customerDetails');
    if (detailsDiv) {
      detailsDiv.innerHTML =
        '<p class="error">Failed to load customer details.</p>';
    }
  }
}

// Show ticket notes in a modal
async function showTicketNotes(ticketId) {
  if (!ticketId) {
    alert('No ticket selected.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/tickets/${ticketId}/notes`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const notes = await response.json();
    const notesContainer = document.getElementById('ticketNotesContainer');
    const notesList = document.getElementById('ticketNotesList');
    const notesTitle = document.getElementById('ticketNotesTitle');
    const timeEntryContainer = document.getElementById('timeEntryContainer');

    // Clear existing notes
    notesList.innerHTML = '';

    if (notes.length === 0) {
      notesList.innerHTML = '<li>No notes available for this ticket.</li>';
    } else {
      notes.forEach(note => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <p>${note.note}</p>
          <small>Created on: ${new Date(note.created_at).toLocaleString()}</small>
        `;
        notesList.appendChild(listItem);
      });
    }

    // Update the title and show the notes and time entry containers
    notesTitle.textContent = `Notes for Ticket #${ticketId}`;
    notesTitle.dataset.ticketId = ticketId; // Store ticket ID for time entry
    notesContainer.style.display = 'block';
    timeEntryContainer.style.display = 'block';
  } catch (error) {
    console.error('Error loading ticket notes:', error);
    alert('Failed to load ticket notes.');
  }
}

// Initialize the page functionality
document.addEventListener('DOMContentLoaded', () => {
  const pathname = window.location.pathname;

  // Database Page Logic
  if (pathname.endsWith('/database.html')) {
    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
      addCustomerForm.addEventListener('submit', addCustomer);
    }
    loadCustomers();

    // Real-time phone number formatting
    const customerPhoneInput = document.getElementById('customerPhone');
    if (customerPhoneInput) {
      customerPhoneInput.addEventListener('input', (event) => {
        const input = event.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        if (input.length <= 10) {
          event.target.value = input
            .replace(/^(\d{3})(\d{0,3})(\d{0,4})$/, (_, p1, p2, p3) =>
              [p1, p2, p3].filter(Boolean).join('-')
            ); // Format as 123-456-7890
        }
      });
    }
  }

  // Tickets Page Logic
  if (pathname.endsWith('/tickets.html')) {
    loadTickets();

    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
      filterForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const type = document.getElementById('type').value;
        const status = document.getElementById('status').value;
        const customerId = document.getElementById('customerId').value.trim();

        loadTickets({ type, status, customerId });
      });
    }

    const timeEntryForm = document.getElementById('timeEntryForm');
    if (timeEntryForm) {
      timeEntryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const ticketId = document.getElementById('ticketNotesTitle').dataset.ticketId;
        const note = document.getElementById('timeDescription').value.trim();

        if (!note) {
          alert('Note is required.');
          return;
        }

        try {
          const response = await fetch(`${apiUrl}/tickets/${ticketId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note }),
          });

          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

          alert('Note added successfully.');
          timeEntryForm.reset();
          showTicketNotes(ticketId);
        } catch (error) {
          console.error('Error adding note:', error);
          alert('Failed to add note.');
        }
      });
    }
  }

  // Customers Page Logic
  if (pathname.endsWith('/customers.html')) {
    loadCustomerDetails();

    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
      addItemForm.addEventListener('submit', addItem);
    }

    const editCustomerForm = document.getElementById('editCustomerForm');
    if (editCustomerForm) {
      editCustomerForm.addEventListener('submit', updateCustomer);
    }
  }

  // Global Back to Home Button Logic
  const backToHomeButtons = document.querySelectorAll('.back-to-home');
  backToHomeButtons.forEach((button) => {
    button.addEventListener('click', goHome);
  });
});

