
import React, { useEffect, useState } from 'react';
import './App.css';

const initialBooks = [
  {
    id: 1,
    title: 'Bophelo ba Lillo',
    author: 'Mathai',
    genre: 'Sotho novel',
    isbn: '9988123456',
    stock: 45,
    available: 45,
  },
];

const initialUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Member',
    joined: '2026-01-15',
  },
];

const loadData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');


useEffect(() => {
  fetchBooks();
  fetchTransactions();
}, []);



async function fetchTransactions() {
  try {
    const response = await fetch(`${API_URL}/transactions`);

    if (!response.ok) {
      throw new Error('Failed to load transactions.');
    }

      await fetchTransactions();
    history
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id))
      .forEach((item) => {
        if (item.transactionType === 'BORROW') {
          loanHistory.push({
            id: item.id,
            bookId: Number(item.bookId),
            userId: Number(item.userId),
            bookTitle: item.bookTitle,
            userName: item.userName,
            issueDate: item.transactionDate,
            returnDate: '',
            status: 'Borrowed',
          });
        }

        if (item.transactionType === 'RETURN') {
          const loan = loanHistory.find(
            (entry) =>
              entry.bookId === Number(item.bookId) &&
              entry.userId === Number(item.userId) &&
              entry.status === 'Borrowed'
          );

          if (loan) {
            loan.status = 'Returned';
            loan.returnDate = item.transactionDate;
          }
        }
      });

   
      console.log('Processed borrowing history:', loanHistory);
setTransactions(loanHistory.reverse());
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
}



    const API_URL = 'http://localhost:5001/api';

  async function fetchBooks() {
    try {
      const response = await fetch(`${API_URL}/books`);

      if (!response.ok) {
        throw new Error('Failed to load books');
      }

      const data = await response.json();

      setBooks(
        data.map((book) => ({
          ...book,
          stock: Number(book.quantity),
          available: Number(book.quantity),
        }))
      );
    } catch (error) {
      console.error('Error loading books:', error);
      alert('Could not load books. Check that your backend is running.');
    }
  }

  const [books, setBooks] = useState(() =>
    loadData('libraryBooks', initialBooks)
  );

  const [users, setUsers] = useState(() =>
    loadData('libraryUsers', initialUsers)
  );

  const [transactions, setTransactions] = useState(() =>
    loadData('libraryTransactions', [])
  );

  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    genre: '',
    isbn: '',
    stock: 1,
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Member',
  });

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [borrowForm, setBorrowForm] = useState({
    userId: '',
    bookId: '',
  });

  useEffect(() => {
    localStorage.setItem('libraryBooks', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('libraryUsers', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(
      'libraryTransactions',
      JSON.stringify(transactions)
    );
  }, [transactions]);

  const totalStock = books.reduce(
    (sum, book) => sum + Number(book.stock),
    0
  );

  const availableBooks = books.reduce(
    (sum, book) => sum + Number(book.available),
    0
  );

  const borrowedBooks = totalStock - availableBooks;

  
async function saveBook(e) {
  e.preventDefault();

  const title = bookForm.title.trim();
  const author = bookForm.author.trim();
  const genre = bookForm.genre.trim();
  const isbn = bookForm.isbn.trim();
  const stock = Number(bookForm.stock);

  if (!title || !author || !genre || !isbn || !/^\d+$/.test(isbn)) {
    alert('Please complete all fields. ISBN must contain digits only.');
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    alert('Stock must be a non-negative whole number.');
    return;
  }

  const duplicate = books.some(
    (book) => book.isbn === isbn && book.id !== editingId
  );

  if (duplicate) {
    alert('A book with this ISBN already exists.');
    return;
  }
  
  
if (editingId !== null) {
  const oldBook = books.find(
    (book) => String(book.id) === String(editingId)
  );

  if (!oldBook) {
    alert('Book not found.');
    return;
  }

  const currentlyBorrowed = oldBook.stock - oldBook.available;

  if (stock < currentlyBorrowed) {
    alert('Stock cannot be less than the number of borrowed copies.');
    return;
  }

  try {
    const response = await fetch(`http://localhost:5001/api/books/${editingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        author,
        genre,
        isbn,
        quantity: stock,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update book');
    }

    await fetchBooks();

    setEditingId(null);
    setBookForm({
      title: '',
      author: '',
      genre: '',
      isbn: '',
      stock: 1,
    });

    alert('Book updated successfully!');
  } catch (error) {
    console.error('Error updating book:', error);
    alert(error.message || 'Could not update the book.');
  }

  return;
}


  try {
    const response = await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        author,
        genre,
        isbn,
        quantity: stock,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save book');
    }

    await fetchBooks();

    setBookForm({
      title: '',
      author: '',
      genre: '',
      isbn: '',
      stock: 1,
    });

    alert('Book saved to MySQL successfully!');
  } catch (error) {
    console.error('Error saving book:', error);
    alert(error.message || 'Could not save the book. Check your backend.');
  }
}


  function editBook(book) {
    setEditingId(book.id);
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      isbn: book.isbn,
      stock: book.stock,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  
async function deleteBook(id) {
  const hasActiveLoan = transactions.some(
    (item) => item.bookId === id && item.status === 'Borrowed'
  );

  if (hasActiveLoan) {
    alert('Return all borrowed copies before deleting this book.');
    return;
  }

  if (window.confirm('Are you sure you want to delete this book?')) {
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete book');
      }

      await fetchBooks();
      alert('Book deleted successfully!');
    } catch (error) {
      console.error('Error deleting book:', error);
      alert(error.message || 'Could not delete book. Check that the backend is running.');
    }
  }
}


 
async function registerUser(e) {
  e.preventDefault();

  const name = userForm.name.trim();
  const email = userForm.email.trim();

  if (!name || !email) {
    alert('Please enter the name and email.');
    return;
  }

  if (users.some(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  )) {
    alert('This email is already registered.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        role: userForm.role,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to register user.');
    }

    const usersResponse = await fetch(`${API_URL}/users`);

    if (!usersResponse.ok) {
      throw new Error('User registered, but the list could not be refreshed.');
    }

    const updatedUsers = await usersResponse.json();
    setUsers(updatedUsers);
    setUserForm({ name: '', email: '', role: 'Member' });
    alert('User registered successfully!');
  } catch (error) {
    console.error('Error registering user:', error);
    alert(error.message || 'Could not register user.');
  }
}


  function deleteUser(id) {
    const hasLoan = transactions.some(
      (item) => item.userId === id && item.status === 'Borrowed'
    );

    if (hasLoan) {
      alert('This member must return their borrowed books first.');
      return;
    }

    if (window.confirm('Delete this user?')) {
      setUsers((prev) => prev.filter((user) => user.id !== id));
    }
  }

  
async function borrowBook(e) {
  e.preventDefault();

  const userId = Number(borrowForm.userId);
  const bookId = Number(borrowForm.bookId);

  const book = books.find((item) => Number(item.id) === bookId);
  const user = users.find((item) => Number(item.id) === userId);

  if (!book || !user) {
    alert('Please select a member and a book.');
    return;
  }

  if (book.available < 1) {
    alert('No copies of this book are currently available.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/transactions/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, userId }),
    });
  
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to borrow book.');
    }

    await fetchBooks();

    const historyResponse = await fetch(`${API_URL}/transactions`);

    if (!historyResponse.ok) {
      throw new Error('Borrowing succeeded, but history could not be refreshed.');
    }

    const history = await historyResponse.json();
    setTransactions(history);

    setBorrowForm({ userId: '', bookId: '' });
    alert('Book borrowed successfully!');
  } catch (error) {
    console.error('Borrow error:', error);
    alert(error.message || 'Could not borrow book.');
  }
}



async function returnBook(id) {
  const loan = transactions.find(
    (item) => Number(item.id) === Number(id) && item.status === 'Borrowed'
  );

  if (!loan) {
    alert('No active borrowing record found.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/transactions/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId: loan.bookId,
        userId: loan.userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to return book.');
    }

    await fetchBooks();
    await fetchTransactions();

    alert('Book returned successfully!');
  } catch (error) {
    console.error('Return error:', error);
    alert(error.message || 'Could not return book.');
  }
}


function Stat({ label, value, icon }) {
  return (
    <div className="stat-box">
      <span className="stat-icon">{icon}</span>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TableWrapper({ children }) {
  return <div className="table-wrapper">{children}</div>;
}

function EmptyRow({ columns }) {
  return (
    <tr>
      <td colSpan={columns} className="empty-row">
        No records found.
      </td>
    </tr>
  );
}


  return (
    <div className="app">
      <header className="top-banner">
          <div>
            <h1>Community Library Management System</h1>
            <p>Manage books, members and borrowing records</p>
        </div>
      </header>

      <nav className="navigation">
        {['Dashboard', 'Books', 'Users', 'Transactions'].map((tab) => (
          <button
            key={tab}
            className={`nav-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="main-card">
        {activeTab === 'Dashboard' && (
  <>
    <h2 className="page-title">Dashboard</h2>
    <p className="subtext">Overview of your community library</p>

    <div className="stats-grid">
      <Stat
        label="Total Books"
        value={totalStock}
      />

      <Stat
        label="Available Books"
        value={availableBooks}
      />

      <Stat
        label="Borrowed Books"
        value={borrowedBooks}
      />

      <Stat
        label="Registered Users"
        value={users.length}
      />
    </div>

    <h3 className="section-heading">Recent Transactions</h3>

    <TableWrapper>
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Member</th>
            <th>Issue Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 ? (
            <EmptyRow columns={4} />
          ) : (
            transactions.slice(0, 5).map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.bookTitle || 'N/A'}</td>
                <td>{transaction.userName || 'N/A'}</td>
                <td>{transaction.issueDate || transaction.transactionDate || 'N/A'}</td>
                <td>
                  <span
                    className={`status ${
                      transaction.status === 'Returned'
                        ? 'returned'
                        : 'borrowed'
                    }`}
                  >
                    {transaction.status || transaction.transactionType || 'N/A'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </TableWrapper>
  </>
)}
        {activeTab === 'Books' && (
          <>
            <h2 className="page-title">Book Management</h2>
            <p className="subtext">Add, edit, search and manage library books.</p>

            <form className="form-card" onSubmit={saveBook}>
              <h3>{editingId !== null ? 'Edit Book' : 'Add a New Book'}</h3>
              <div className="form-grid">
                <Field label="Book Title">
                  <input required value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
                </Field>
                <Field label="Author">
                  <input required value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
                </Field>
                <Field label="Genre">
                  <input required value={bookForm.genre}
                    onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })} />
                </Field>
                <Field label="ISBN (digits only)">
                  <input required value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })} />
                </Field>
                <Field label="Quantity">
                  <input type="number" min="0" required value={bookForm.stock}
                    onChange={(e) => setBookForm({ ...bookForm, stock: e.target.value })} />
                </Field>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit">
                  {editingId !== null ? 'Update Book' : 'Add Book'}
                </button>
                {editingId !== null && (
                  <button className="secondary-button" type="button" onClick={() => {
                    setEditingId(null);
                    setBookForm({ title: '', author: '', genre: '', isbn: '', stock: 1 });
                  }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="search-bar">
              <input placeholder="Search by title, author or ISBN..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <TableWrapper>
              <table>
                <thead>
                  <tr>
                    <th>Title</th><th>Author</th><th>Genre</th>
                    <th>ISBN</th><th>Quantity</th><th>Available</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.filter((book) =>
                    `${book.title} ${book.author} ${book.isbn}`.toLowerCase()
                      .includes(search.toLowerCase())
                  ).length === 0 ? (
                    <EmptyRow columns={7} />
                  ) : books.filter((book) =>
                    `${book.title} ${book.author} ${book.isbn}`.toLowerCase()
                      .includes(search.toLowerCase())
                  ).map((book) => (
                    <tr key={book.id}>
                      <td>{book.title}</td><td>{book.author}</td><td>{book.genre}</td>
                      <td>{book.isbn}</td><td>{book.stock}</td><td>{book.available}</td>
                      <td>
                        <div className="action-cell">
                          <button className="small-button edit-button" onClick={() => editBook(book)}>Edit</button>
                          <button className="small-button delete-button" onClick={() => deleteBook(book.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </>
        )}

        {activeTab === 'Users' && (
          <>
            <h2 className="page-title">User Management</h2>
            <p className="subtext">Register and manage library members.</p>

            <form className="form-card" onSubmit={registerUser}>
              <h3>Register a Member</h3>
              <div className="form-grid">
                <Field label="Full Name">
                  <input required value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
                </Field>
                <Field label="Email Address">
                  <input type="email" required value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                </Field>
                <Field label="Role">
                  <select value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                    <option value="Member">Member</option>
                    <option value="Librarian">Librarian</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </Field>
              </div>
              <button className="primary-button" type="submit">Register Member</button>
            </form>

            <TableWrapper>
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Membership ID</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.length === 0 ? <EmptyRow columns={5} /> : users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td><td>{user.email || '—'}</td>
                      <td>{user.role}</td><td>{user.membership_id || user.membershipId || '—'}</td>
                      <td>
                        <button className="small-button delete-button" onClick={() => deleteUser(user.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </>
        )}

        {activeTab === 'Transactions' && (
          <>
            <h2 className="page-title">Transactions</h2>
            <p className="subtext">Record book borrowing and returns.</p>

            <form className="form-card" onSubmit={borrowBook}>
              <h3>Borrow a Book</h3>
              <div className="form-grid">
                <Field label="Member">
                  <select required value={borrowForm.userId}
                    onChange={(e) => setBorrowForm({ ...borrowForm, userId: e.target.value })}>
                    <option value="">Select a member</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Book">
                  <select required value={borrowForm.bookId}
                    onChange={(e) => setBorrowForm({ ...borrowForm, bookId: e.target.value })}>
                    <option value="">Select a book</option>
                    {books.filter((book) => book.available > 0).map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} ({book.available} available)
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <button className="primary-button" type="submit">Borrow Book</button>
            </form>

            <h3 className="section-heading">Borrowing History</h3>
            <TableWrapper>
              <table>
                <thead>
                  <tr><th>Book</th><th>Member</th><th>Issue Date</th><th>Return Date</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? <EmptyRow columns={6} /> : transactions.map((item, index) => (
                    <tr key={`${item.id}-${index}`}>
                      <td>{item.bookTitle || 'Unknown book'}</td>
                      <td>{item.userName || 'Unknown member'}</td>
                      <td>{item.issueDate || item.transactionDate || '—'}</td>
                      <td>{item.returnDate || '—'}</td>
                      <td>
                        <span className={`status ${(item.status || '').toLowerCase()}`}>
                          {item.status || item.transactionType || '—'}
                        </span>
                      </td>
                      <td>
                        {item.status === 'Borrowed' && (
                          <button className="small-button edit-button"
                            onClick={() => returnBook(item.id)}>
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </>
        )}
      </main>

      <footer className="footer">Community Library Management System</footer>
    </div>
  );
}
