document.addEventListener('DOMContentLoaded', () => {
    const quotes = [
        // --- The Magic of Reading ---
        { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
        { text: "We read to know we are not alone.", author: "C.S. Lewis" },
        { text: "Reading is a conversation. All books talk. But a good book listens as well.", author: "Mark Haddon" },
        { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
        { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
        { text: "That is part of the beauty of all literature. You discover that your longings are universal longings, that you're not lonely and isolated from anyone. You belong.", author: "F. Scott Fitzgerald" },
        { text: "Reading gives us someplace to go when we have to stay where we are.", author: "Mason Cooley" },
        { text: "Sleep is good, he said, and books are better.", author: "George R.R. Martin" },
        { text: "Books are a uniquely portable magic.", author: "Stephen King" },
        { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
        { text: "Until I feared I would lose it, I never loved to read. One does not love breathing.", author: "Harper Lee" },
        { text: "So many books, so little time.", author: "Frank Zappa" },
        { text: "Books are mirrors: you only see in them what you already have inside you.", author: "Carlos Ruiz Zafón" },
        { text: "I find television very educating. Every time somebody turns on the set, I go into the other room and read a book.", author: "Groucho Marx" },
        
        // --- Wisdom & Knowledge ---
        { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
        { text: "It is what you read when you don't have to that determines what you will be when you can't help it.", author: "Oscar Wilde" },
        { text: "Think before you speak. Read before you think.", author: "Fran Lebowitz" },
        { text: "Whatever the cost of our libraries, the price is cheap compared to that of an ignorant nation.", author: "Walter Cronkite" },
        { text: "Whenever you read a good book, somewhere in the world a door opens to allow in more light.", author: "Vera Nazarian" },
        { text: "A mind needs books as a sword needs a whetstone, if it is to keep its edge.", author: "George R.R. Martin" },
        { text: "Education is not the learning of facts, but the training of the mind to think.", author: "Albert Einstein" },
        { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
        { text: "Real knowledge is to know the extent of one's ignorance.", author: "Confucius" },
        { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
        
        // --- Wit & Cynicism ---
        { text: "Outside of a dog, a book is man's best friend. Inside of a dog it's too dark to read.", author: "Groucho Marx" },
        { text: "Classic' - a book which people praise and don't read.", author: "Mark Twain" },
        { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
        { text: "If you don’t like to read, you haven’t found the right book.", author: "J.K. Rowling" },
        { text: "Never trust anyone who has not brought a book with them.", author: "Lemony Snicket" },
        { text: "Good friends, good books, and a sleepy conscience: this is the ideal life.", author: "Mark Twain" },
        { text: "Always read something that will make you look good if you die in the middle of it.", author: "P.J. O'Rourke" },
        
        // --- Life & Philosophy ---
        { text: "It does not do to dwell on dreams and forget to live.", author: "J.K. Rowling" },
        { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
        { text: "The unexamined life is not worth living.", author: "Socrates" },
        { text: "To live is the rarest thing in the world. Most people exist, that is all.", author: "Oscar Wilde" },
        { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
        { text: "Do not go gentle into that good night. Rage, rage against the dying of the light.", author: "Dylan Thomas" },
        { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
        { text: "It is never too late to be what you might have been.", author: "George Eliot" },
        { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
        
        // --- Writing & Words ---
        { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
        { text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.", author: "J.K. Rowling" },
        { text: "A word after a word after a word is power.", author: "Margaret Atwood" },
        { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
        { text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison" },
        { text: "Tears are words that need to be written.", author: "Paulo Coelho" },
        { text: "You can make anything by writing.", author: "C.S. Lewis" },
        
        // --- The Value of Time & Focus ---
        { text: "Time is a created thing. To say 'I don't have time,' is like saying, 'I don't want to'.", author: "Lao Tzu" },
        { text: "Beware the barrenness of a busy life.", author: "Socrates" },
        { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
        { text: "Lost time is never found again.", author: "Benjamin Franklin" },
        { text: "Focus matches your reality.", author: "Unknown" },
        { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    
        // --- On Books & Society ---
        { text: "A room without books is like a body without a soul.", author: "Cicero" },
        { text: "I cannot live without books.", author: "Thomas Jefferson" },
        { text: "Where they have burned books, they will end in burning human beings.", author: "Heinrich Heine" },
        { text: "Show me a family of readers, and I will show you the people who move the world.", author: "Napoleon Bonaparte" },
        { text: "Libraries will get you through times of no money better than money will get you through times of no libraries.", author: "Anne Herbert" },
        { text: "If you only read the books that everyone else is reading, you can only think what everyone else is thinking.", author: "Haruki Murakami" },
    
        // --- Short & Punchy ---
        { text: "Make it new.", author: "Ezra Pound" },
        { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
        { text: "Keep going.", author: "Unknown" },
        { text: "Hell is other people.", author: "Jean-Paul Sartre" },
        { text: "Knowledge is power.", author: "Francis Bacon" },
        { text: "I think, therefore I am.", author: "René Descartes" },
        
        // --- Indian Wisdom (Contextual) ---
        { text: "You can't cross the sea merely by standing and staring at the water.", author: "Rabindranath Tagore" },
        { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
        { text: "We are what our thoughts have made us; so take care about what you think.", author: "Swami Vivekananda" },
        { text: "Facts are many, but the truth is one.", author: "Rabindranath Tagore" },
        { text: "The mind is everything. What you think you become.", author: "Buddha" },
        
        // --- Modern Inspiration ---
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
        { text: "Failure is the condiment that gives success its flavor.", author: "Truman Capote" },
        { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
        { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
        { text: "Impossible is just an opinion.", author: "Paulo Coelho" },
        { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
        { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
        
        // --- Deep Thoughts ---
        { text: "We do not see things as they are, we see them as we are.", author: "Anaïs Nin" },
        { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
        { text: "Man is condemned to be free.", author: "Jean-Paul Sartre" },
        { text: "Those who do not remember the past are condemned to repeat it.", author: "George Santayana" },
        { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
        { text: "Happiness depends upon ourselves.", author: "Aristotle" },
        
        // --- On Learning ---
        { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
        { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
        { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
        { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
        { text: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },
        
        // --- Reading Aesthetics ---
        { text: "I declare after all there is no enjoyment like reading!", author: "Jane Austen" },
        { text: "When I have a little money, I buy books; and if I have any left, I buy food and clothes.", author: "Desiderius Erasmus" },
        { text: "Rain, tea, and a good book.", author: "Unknown" },
        { text: "Bibliophile: A person who loves or collects books.", author: "Dictionary" },
        { text: "The world was hers for the reading.", author: "Betty Smith" },
        
        // --- Stoicism ---
        { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
        { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
        { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
        { text: "If it is not right do not do it; if it is not true do not say it.", author: "Marcus Aurelius" },
        
        // --- Just for Fun ---
        { text: "I read banned books.", author: "Unknown" },
        { text: "My weekend is all booked.", author: "Unknown" },
        { text: "Dinosaurs didn't read. Now they are extinct.", author: "Unknown" },
        { text: "Just one more chapter...", author: "Every Reader" }
    ];

    const container = document.getElementById('sticky-quote-container');
    if (!container) return;

    // Select a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const quoteText = `"${randomQuote.text}" — ${randomQuote.author}`;
    
    const quoteElement = container.querySelector('.sticky-quote-text');
    
    // Typewriter effect
    let i = 0;
    const speed = 50; // typing speed in ms

    function typeWriter() {
        if (i < quoteText.length) {
            quoteElement.innerHTML += quoteText.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else {
            // Trigger flash animation after typing is done
            const flash = document.createElement('div');
            flash.classList.add('quote-flash');
            container.appendChild(flash);
        }
    }

    // Start typing
    typeWriter();

    // Remove after 30 seconds
    setTimeout(() => {
        container.classList.add('fade-out');
        setTimeout(() => {
            container.remove();
        }, 1000); // Wait for fade out
    }, 30000);
});
