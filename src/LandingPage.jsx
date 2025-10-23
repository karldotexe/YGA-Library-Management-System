import { Link, useNavigate } from "react-router-dom";
import './LandingPage.css';
import LibLogo from './images/LibLogo.png';
import YGALogo from './images/YGALogo.png';
import H1Page1 from './images/H1ForPage1.png';
import AboutCard from './images/About-Card.png';
import { useEffect, useState } from "react";
import { supabase } from "./../supabase-client.js";
import { FaArrowUp } from "react-icons/fa";

function LandingPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  
  // NEW: State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  // --- NEW: State for scroll-to-top button ---
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (session) console.log("Session found:", JSON.parse(session));

    fetchBooks();
  }, []);

  const handleLoginClick = () => {
    const session = localStorage.getItem('adminSession');
    if (session) navigate('/admin/dashboard');
    else navigate('/login');
    
  };

  useEffect(() => {
    const checkScrollTop = () => {
      // Show button if scrolled more than 400px
      if (!showScrollBtn && window.scrollY > 400) {
        setShowScrollBtn(true);
      } else if (showScrollBtn && window.scrollY <= 400) {
        setShowScrollBtn(false);
      }
    };

    window.addEventListener("scroll", checkScrollTop);
    // Cleanup function
    return () => window.removeEventListener("scroll", checkScrollTop);

  }, [showScrollBtn]); // Dependency ensures this logic reruns only when showScrollBtn changes

  

  const fetchBooks = async () => {
    // Select all columns, including the new 'description'
    const { data, error } = await supabase.from("books").select("*");
    if (error) console.error("Error fetching books:", error);
    else setBooks(data);
  };

  // NEW: Handlers for opening and closing the modal
  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null); // Clear selected book
  };


  return (
    <div className="Page-Container">
      {/* First Page */}
      <div className='First-Page' id="home">
        <nav className='NavBarContainer'>
          <div className='NavTextContainer'>
            <a className='NavText' href="#home">Home</a> 
            <a className='NavText' href="#about">About</a> 
            <a className='NavText' href="#books">Books</a>
          </div>

          <div className='LibLogoContainer'>
            <img
              id='LibLogoId'
              src={LibLogo}
              alt="Library Logo"
              style={{ cursor: "pointer" }}
              onClick={() => navigate('/')}
            />
          </div>

          <div className='YGALogoContainer'>
            <img id='YGALogoId' src={YGALogo} alt="YGA Logo" />
          </div>
        </nav>

        <div className='H1-Container'>
          <h1>Books take you anywhere you want to go.</h1>
          <img id='H1Page1' src={H1Page1} alt="H1" />

          <div className="ButtonGroup">
            <button className='LogIn' onClick={handleLoginClick}>Log In</button>
            <Link to="/signup">
              <button className='SignUp'>Sign Up</button>
            </Link>
          </div>
        </div>
      </div>

      {/* About Page */}
      <div className="About-Page" id='about'>
        <h2>About</h2>
        <div className='Main-Container'>
          <div className='Content-Container'>
            <div className='Text-Container'>
              <h1>
                Welcome to our <br /> online school library.
              </h1>
              <h3>
                At <span className='HighlightText'>Young Generation Academy</span>, our library is a special place where stories come alive
                and young minds begin their adventures.
              </h3>
            </div>
            <div className='AboutCardContainer'>
              <img id='AboutCardId' src={AboutCard} alt="About Card"/>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="mission-vision-container">
          <div className="mission-section">
            <div className="mission-header">
              <h3>Our Mission</h3>
            </div>
            <div className="mission-content">
              <p>Young Generation Academy is an educational institution whose fundamental goal is to develop a child into a responsible, perceptive and God-fearing individual.</p>
            </div>
          </div>

          <div className="vision-section">
            <div className="vision-header">
              <h3>Our Vision</h3>
            </div>
            <div className="vision-content">
              <p>Young Generation Academy pupils are perceived to be individuals who are physically and emotionally stable, technologically advanced, spiritually inclined and intellectually and globally competitive in whatever endeavors they will get into today, tomorrow and in the years to come.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Books Page */}
      <div className="Books-Page" id="books">
        <div className="lp-books-page">
          <div className='lp-h2-container'><h2>Books</h2></div>
          
          {/* UPDATED: Book List */}
          <div className="lp-book-list">
            {books.length > 0 ? (
              books.map((book) => (
                <div 
                  key={book.isbn} 
                  className="lp-book-card" 
                  onClick={() => handleBookClick(book)}
                >
                  <img src={book.image} alt={book.title} className="lp-book-cover" />
                  {/* --- I added the title here --- */}
                  <div className="lp-book-overlay-text">{book.title}</div>
                </div>
              ))
            ) : (
              <p className="lp-no-books">No books found.</p>
            )}
          </div>

          {/* ================================================== */}
          {/* NEW: Modal Structure with UNIQUE Class Names       */}
          {/* ================================================== */}
          {isModalOpen && selectedBook && (
            <div className="lp-book-detail-modal-overlay" onClick={handleCloseModal}>
              <div className="lp-book-detail-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="lp-book-detail-modal-close-button" onClick={handleCloseModal}>&times;</button>
                <img src={selectedBook.image} alt={selectedBook.title} className="lp-book-detail-modal-cover" />
                <div className="lp-book-detail-modal-info">
                  <h3>{selectedBook.title}</h3>
                  <p className="lp-book-detail-modal-author">by {selectedBook.author}</p>
                  <p className="lp-book-detail-modal-description">{selectedBook.description || "No description available."}</p>
                  <div className="lp-book-detail-modal-details-grid">
                    <p className="lp-book-detail-modal-detail-item"><strong>Genre:</strong> {selectedBook.genre}</p>
                    <p className="lp-book-detail-modal-detail-item"><strong>Year:</strong> {selectedBook.year}</p>
                    <p className="lp-book-detail-modal-detail-item"><strong>Copies:</strong> {selectedBook.copies}</p>
                    <p className="lp-book-detail-modal-detail-item"><strong>ISBN:</strong> {selectedBook.isbn}</p>
                  </div>
                </div>
                
              </div>
              
            </div>
            
          )}
          
          
        </div>
        
      
      </div>
      {showScrollBtn && (
        <a href="#home" className="lp-scroll-to-top-btn">
          <FaArrowUp /> {/* <-- CHANGED */}
        </a>
      )}
    </div>
    
  );
}

export default LandingPage;