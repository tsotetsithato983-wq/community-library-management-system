
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306)
});

app.get('/', (req, res) => {
    res.send('Community Library backend is running!');
});

app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT DATABASE() AS database_name'
        );
        res.json({
            message: 'MySQL connected successfully!',
            database: rows[0].database_name
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            error: 'Database connection failed'
        });
    }
});

app.get('/api/books', async (req, res) => {
    try {
        const [books] = await db.query(
            'SELECT * FROM books ORDER BY id DESC'
        );
        res.json(books);
    } catch (error) {
       console.error('BOOKS ERROR:', error);

res.status(500).json({
    error: 'Failed to fetch books',
    details: error.message
});
    }
});

app.post('/api/books', async (req, res) => {
    try {
        const { title, author, genre, isbn, quantity } = req.body;

        if (
            !title?.trim() ||
            !author?.trim() ||
            quantity === undefined ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                error: 'Enter a title, author, and valid quantity'
            });
        }

        const [result] = await db.query(
            `INSERT INTO books (title, author, genre, isbn, quantity)
             VALUES (?, ?, ?, ?, ?)`,
            [
                title.trim(),
                author.trim(),
                genre || null,
                isbn || null,
                Number(quantity)
            ]
        );

        res.status(201).json({
            message: 'Book added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            error: 'Failed to add book'
        });
    }
});


app.put('/api/books/:id', async (req, res) => {
    try {
        const { title, author, genre, isbn, quantity } = req.body;
        const { id } = req.params;

        if (
            !title?.trim() ||
            !author?.trim() ||
            quantity === undefined ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                error: 'Enter a title, author, and valid quantity'
            });
        }

        const [result] = await db.query(
            `UPDATE books
             SET title = ?, author = ?, genre = ?, isbn = ?, quantity = ?
             WHERE id = ?`,
            [
                title.trim(),
                author.trim(),
                genre || null,
                isbn || null,
                Number(quantity),
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Book not found'
            });
        }

        res.json({ message: 'Book updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            error: 'Failed to update book'
        });
    }
});



app.get('/api/users', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT * FROM users ORDER BY id DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({
            error: 'Failed to fetch users'
        });
    }
});



app.post('/api/users', async (req, res) => {
    try {
        const { name, email, role } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                error: 'Name and email are required'
            });
        }

        const membershipId = `MEM-${Date.now()}`;

        const [result] = await db.query(
            'INSERT INTO users (name, email, membership_id, role) VALUES (?, ?, ?, ?)',
            [name.trim(), email.trim(), membershipId, role || 'Member']
        );

        res.status(201).json({
            message: 'User registered successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error registering user:', error.message);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'This email or membership ID is already registered'
            });
        }

        res.status(500).json({
            error: 'Failed to register user'
        });
    }
});


app.get('/api/transactions', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                t.id,
                t.book_id AS bookId,
                t.user_id AS userId,
                b.title AS bookTitle,
                u.name AS userName,
                t.transaction_type AS transactionType,
                t.quantity,
                DATE_FORMAT(t.transaction_date, '%Y-%m-%d') AS transactionDate
            FROM transactions t
            JOIN books b ON b.id = t.book_id
            LEFT JOIN users u ON u.id = t.user_id
            ORDER BY t.transaction_date DESC, t.id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});



app.post('/api/transactions/borrow', async (req, res) => {
    const { bookId, userId } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [books] = await connection.query(
            'SELECT quantity FROM books WHERE id = ? FOR UPDATE',
            [bookId]
        );

        if (!books.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Book not found' });
        }

        if (Number(books[0].quantity) < 1) {
            await connection.rollback();
            return res.status(400).json({ error: 'No copies available' });
        }

        const [users] = await connection.query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (!users.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        await connection.query(
            'UPDATE books SET quantity = quantity - 1 WHERE id = ?',
            [bookId]
        );

        await connection.query(
            `INSERT INTO transactions
             (book_id, user_id, transaction_type, quantity)
             VALUES (?, ?, 'BORROW', 1)`,
            [bookId, userId]
        );

        await connection.commit();
        res.status(201).json({ message: 'Book borrowed successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Borrow error:', error.message);
        res.status(500).json({ error: 'Failed to borrow book' });
    } finally {
        connection.release();
    }
});

app.post('/api/transactions/return', async (req, res) => {
    const { bookId, userId } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [loans] = await connection.query(
            `SELECT id FROM transactions
             WHERE book_id = ? AND user_id = ?
             AND transaction_type = 'BORROW'
             AND id > COALESCE((
                 SELECT MAX(r.id) FROM transactions r
                 WHERE r.book_id = ? AND r.user_id = ?
                 AND r.transaction_type = 'RETURN'
             ), 0)
             ORDER BY id ASC LIMIT 1 FOR UPDATE`,
            [bookId, userId, bookId, userId]
        );

        if (!loans.length) {
            await connection.rollback();
            return res.status(400).json({ error: 'No outstanding loan found' });
        }

        await connection.query(
            'UPDATE books SET quantity = quantity + 1 WHERE id = ?',
            [bookId]
        );

        await connection.query(
            `INSERT INTO transactions
             (book_id, user_id, transaction_type, quantity)
             VALUES (?, ?, 'RETURN', 1)`,
            [bookId, userId]
        );

        await connection.commit();
        res.json({ message: 'Book returned successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Return error:', error.message);
        res.status(500).json({ error: 'Failed to return book' });
    } finally {
        connection.release();
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM books WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Failed to delete book' });
  }
});

