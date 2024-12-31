const apiUrl = 'http://localhost:3000/api'; // Base API URL

// Redirect to the home page
function goHome() {
  window.location.href = '/';
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
  const phone = document.getElementById('customerPhone').value.trim();

  if (!name) {
    alert('Customer name is required.');
    return;
  }

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

// Load customer details (customers.html)
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

    // Populate Customer Details
    const detailsDiv = document.getElementById('customerDetails');
    detailsDiv.innerHTML = `
      <h2>${customer.name || 'Customer Name Not Found'}</h2>
      <p>Email: ${customer.email || 'No email provided'}</p>
      <p>Phone: ${customer.phone || 'No phone number provided'}</p>
      <h3>Items:</h3>
      <ul id="itemsList">
        ${items.length > 0
          ? items
              .map(
                item => `
              <li>
                ${item.name}
                <button class="remove-button" onclick="removeItem(${item.id}, this)" style="display: none;">Remove</button>
              </li>
            `
              )
              .join('')
          : '<li>No items associated with this customer.</li>'}
      </ul>
    `;
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


// Toggle the visibility of the edit form
function toggleEditForm() {
  const editContainer = document.getElementById('editCustomerContainer');
  const editButton = document.getElementById('editToggleButton');
  const removeButtons = document.querySelectorAll('.remove-button');

  // Toggle the visibility of the edit form
  if (editContainer.style.display === 'none') {
    editContainer.style.display = 'block';
    editButton.textContent = 'Cancel';

    // Show all Remove buttons
    removeButtons.forEach(button => {
      button.style.display = 'inline-block';
    });
  } else {
    editContainer.style.display = 'none';
    editButton.textContent = 'Edit';

    // Hide all Remove buttons
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

  if (!customerId || !name) {
    alert('Customer ID or Name is missing.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    alert('Customer updated successfully!');
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
  if (editContainer.style.display === 'none') {
    editContainer.style.display = 'block';
    editButton.textContent = 'Cancel';
  } else {
    editContainer.style.display = 'none';
    editButton.textContent = 'Edit';
  }
}

// Initialize the page functionality
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('/database.html')) {
    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
      addCustomerForm.addEventListener('submit', addCustomer);
    }
    loadCustomers();
  } else if (window.location.pathname.endsWith('/customers.html')) {
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
});