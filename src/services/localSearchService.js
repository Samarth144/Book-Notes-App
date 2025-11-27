const pool = require('../db/pool');
const { searchBooks } = require('./bookService');

/**
 * Performs a full-text search across local books and notes.
 * @param {string} query The search query.
 * @param {number} userId The ID of the current user to filter notes.
 * @returns {Promise<Array>} A promise that resolves to an array of local search results.
 */
async function searchLocal(query, userId) {
    const searchTerm = query.split(/\s+/).filter(Boolean).join(' & '); // Convert to tsquery format
    
    // Search books
    const bookResults = await pool.query(
        `SELECT 
            b.id, b.title, b.author, b.cover_image_url,
            ts_rank(b.search_vector, to_tsquery('english', $1)) as rank
        FROM books b
        JOIN users_books ub ON b.id = ub.book_id
        WHERE ub.user_id = $2 AND b.search_vector @@ to_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT 5`, // Limit local book results
        [searchTerm, userId]
    );

    // Search notes
    const noteResults = await pool.query(
        `SELECT 
            n.id as note_id, n.content_markdown, n.excerpt, n.page, n.chapter, n.created_at, n.share_slug,
            b.id as book_id, b.title as book_title, b.author as book_author, b.cover_image_url,
            ts_rank(n.search_vector, to_tsquery('english', $1)) as rank
        FROM notes n
        JOIN books b ON n.book_id = b.id
        WHERE n.user_id = $2 AND n.search_vector @@ to_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT 10`, // Limit local note results
        [searchTerm, userId]
    );

    return {
        books: bookResults.rows,
        notes: noteResults.rows,
    };
}


async function getTrendingAuthors() {
    const allAuthors = [
        'Rabindranath Tagore', 'R.K. Narayan', 'Ruskin Bond', 'Mulk Raj Anand', 'Raja Rao', 
        'Khushwant Singh', 'Vikram Seth', 'Salman Rushdie', 'Arundhati Roy', 'Amitav Ghosh', 
        'Jhumpa Lahiri', 'Kiran Desai', 'Aravind Adiga', 'Rohinton Mistry', 'Anita Desai',
        'Chetan Bhagat', 'Amish Tripathi', 'Devdutt Pattanaik', 'Sudha Murty', 'Chitra Banerjee Divakaruni',
        'Ashwin Sanghi', 'Anuja Chauhan', 'Preeti Shenoy', 'Ravinder Singh', 'Durjoy Datta',
        'Vikas Swarup', 'Ravi Subramanian', 'Twinkle Khanna', 'Sudeep Nagarkar', 'Novoneel Chakraborty',
        'Munshi Premchand', 'Harivansh Rai Bachchan', 'Ramdhari Singh Dinkar', 'Mahadevi Verma', 'Jaishankar Prasad',
        'Suryakant Tripathi \'Nirala\'', 'Saadat Hasan Manto', 'Ismat Chughtai', 'Gulzar', 'Javed Akhtar',
        'Kaifi Azmi', 'Bhisham Sahni', 'Yashpal', 'Dharamvir Bharati', 'Krishna Sobti',
        'Mannu Bhandari', 'Nirmal Verma', 'Phanishwar Nath \'Renu\'', 'Sri Lal Sukla', 'Kamleshwar',
        'Kamala Das', 'Vaikom Muhammad Basheer', 'M.T. Vasudevan Nair', 'O.V. Vijayan', 'Kalki Krishnamurthy',
        'Subramania Bharati', 'Perumal Murugan', 'Sujatha Rangarajan', 'U.R. Ananthamurthy', 'S.L. Bhyrappa',
        'Kuvempu', 'Girish Karnad', 'Shivaram Karanth', 'P. Lankesh', 'Viswanatha Satyanarayana',
        'Sarat Chandra Chattopadhyay', 'Bankim Chandra Chatterjee', 'Bibhutibhushan Bandyopadhyay', 'Mahasweta Devi', 'Sunil Gangopadhyay',
        'Ashapurna Devi', 'Satyajit Ray', 'Amrita Pritam', 'Nanak Singh', 'P.L. Deshpande',
        'Vijay Tendulkar', 'V.S. Khandekar', 'Shivaji Sawant', 'Vishwas Patil', 'Jhaverchand Meghani',
        'Pannalal Patel', 'Fakir Mohan Senapati', 'Indira Goswami', 'Gopinath Mohanty',
        'Shashi Tharoor', 'Ramachandra Guha', 'William Dalrymple', 'Sanjeev Sanyal', 'Manu S. Pillai',
        'Gurcharan Das', 'Siddhartha Mukherjee', 'Atul Gawande', 'Upamanyu Chatterjee', 'Jeet Thayil',
        'Jerry Pinto', 'Namita Gokhale', 'Anita Nair', 'Nayantara Sahgal', 'Nissim Ezekiel', 'Sarojini Naidu',
        'William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Leo Tolstoy', 'Fyodor Dostoevsky', 
        'Mark Twain', 'Victor Hugo', 'Alexandre Dumas', 'Charlotte Brontë', 'Emily Brontë', 
        'Herman Melville', 'Miguel de Cervantes', 'Gustave Flaubert', 'Johann Wolfgang von Goethe', 'Dante Alighieri', 
        'Homer', 'Oscar Wilde', 'Louisa May Alcott', 'Lewis Carroll', 'Edgar Allan Poe',
        'Ernest Hemingway', 'F. Scott Fitzgerald', 'George Orwell', 'Virginia Woolf', 'James Joyce', 
        'Franz Kafka', 'Albert Camus', 'William Faulkner', 'John Steinbeck', 'Vladimir Nabokov', 
        'J.D. Salinger', 'Harper Lee', 'Joseph Heller', 'Sylvia Plath', 'Samuel Beckett',
        'J.K. Rowling', 'Stephen King', 'Agatha Christie', 'Dan Brown', 'James Patterson', 
        'John Grisham', 'Paulo Coelho', 'Danielle Steel', 'Ken Follett', 'Jeffrey Archer', 
        'Nora Roberts', 'Sidney Sheldon', 'Lee Child', 'David Baldacci', 'Nicholas Sparks',
        'J.R.R. Tolkien', 'George R.R. Martin', 'C.S. Lewis', 'Isaac Asimov', 'Frank Herbert', 
        'Arthur C. Clarke', 'Ray Bradbury', 'H.G. Wells', 'Ursula K. Le Guin', 'Margaret Atwood', 
        'Neil Gaiman', 'Terry Pratchett', 'Rick Riordan', 'Roald Dahl', 'Philip K. Dick',
        'Gabriel García Márquez', 'Haruki Murakami', 'Jorge Luis Borges', 'Pablo Neruda', 'Isabel Allende', 
        'Chinua Achebe', 'Chimamanda Ngozi Adichie', 'Orhan Pamuk', 'Khaled Hosseini', 'Kazuo Ishiguro', 
        'Mo Yan', 'Wole Soyinka', 'Naguib Mahfouz', 'Umberto Eco', 'Italo Calvino', 
        'Milan Kundera', 'Mario Vargas Llosa', 'Roberto Bolaño', 'Elena Ferrante', 'Stieg Larsson', 
        'Henrik Ibsen', 'Anton Chekhov', 'Yukio Mishima', 'Elif Shafak', 'Ngugi wa Thiong\'o',
        'Toni Morrison', 'Maya Angelou', 'Alice Walker', 'James Baldwin', 'Kurt Vonnegut', 
        'Cormac McCarthy', 'Hunter S. Thompson', 'Truman Capote', 'Jack Kerouac', 'Zora Neale Hurston'
    ];
    const selected = allAuthors.sort(() => 0.5 - Math.random()).slice(0, 3);

    return Promise.all(selected.map(async (name) => {
        try {
            const books = await searchBooks(name);
            return {
                name,
                search_query: name,
                books: books.slice(0, 4).map(book => ({
                    ...book,
                    thumbnail: book.thumbnail || '/images/placeholder.jpg'
                }))
            };
        } catch (error) {
            console.error(`Failed to fetch books for author ${name}:`, error);
            return { name, search_query: name, books: [] };
        }
    }));
}

async function getTrendingGenres() {
    const allGenres = [
        // Fiction
        'Fiction', 'Fantasy', 'High Fantasy', 'Urban Fantasy', 'Magical Realism',
        'Science Fiction', 'Dystopian', 'Space Opera', 'Cyberpunk', 'Hard Sci-Fi',
        'Mystery & Crime', 'Crime Thriller', 'Cozy Mystery', 'Detective/Noir', 'Police Procedural',
        'Thriller & Suspense', 'Psychological Thriller', 'Legal Thriller', 'Spy/Espionage',
        'Romance', 'Contemporary Romance', 'Historical Romance', 'Paranormal Romance', 'Rom-Com',
        'Historical Fiction', 'Period Piece', 'Alternate History',
        'Horror', 'Gothic', 'Supernatural', 'Slasher/Survival',
        'Literary Fiction', 'Graphic Novels', 'Manga',

        // Non-Fiction
        'Non-Fiction', 'Biography & Memoir', 'Autobiography', 'Biography', 'Memoir',
        'Self-Help & Personal Development', 'Productivity', 'Psychology', 'Spirituality / Mindfulness',
        'Business & Money', 'Economics', 'Management & Leadership', 'Finance / Investing', 'Entrepreneurship',
        'History', 'Ancient History', 'Modern History', 'Military History',
        'Science & Nature', 'Physics / Astrophysics', 'Biology / Evolution', 'Environment',
        'Politics & Social Sciences', 'Philosophy', 'Sociology', 'Current Affairs',
        'Lifestyle', 'Cookbooks / Food', 'Travel', 'Health & Fitness',
        'Art & Design', 'True Crime',

        // By Age Group (can also be considered genres/categories)
        "Children's", 'Middle Grade', 'Young Adult', 'New Adult'
    ];
    const selected = allGenres.sort(() => 0.5 - Math.random()).slice(0, 3);

    return Promise.all(selected.map(async (name) => {
        try {
            const books = await searchBooks(name);
            return {
                name,
                search_query: name,
                books: books.slice(0, 4).map(book => ({
                    ...book,
                    thumbnail: book.thumbnail || '/images/placeholder.jpg'
                }))
            };
        } catch (error) {
            console.error(`Failed to fetch books for genre ${name}:`, error);
            return { name, search_query: name, books: [] };
        }
    }));
}

async function getTrendingTopics() {
    const allTopics = ['Productivity', 'Artificial Intelligence', 'Self-help', 'Climate Change', 'Mindfulness', 'Stoicism', 'Startups'];
    const selected = allTopics.sort(() => 0.5 - Math.random()).slice(0, 3);

    return Promise.all(selected.map(async (name) => {
        try {
            const books = await searchBooks(name);
            return {
                name,
                search_query: name,
                books: books.slice(0, 4).map(book => ({
                    ...book,
                    thumbnail: book.thumbnail || '/images/placeholder.jpg'
                }))
            };
        } catch (error) {
            console.error(`Failed to fetch books for topic ${name}:`, error);
            return { name, search_query: name, books: [] };
        }
    }));
}

async function getTrendingSearches() {
    const [authors, genres, topics] = await Promise.all([
        getTrendingAuthors(),
        getTrendingGenres(),
        getTrendingTopics()
    ]);

    return { authors, genres, topics };
}

module.exports = {
    searchLocal,
    getTrendingSearches,
};
