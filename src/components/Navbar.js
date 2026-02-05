'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
      <div className="container">
        <Link href="/" className="navbar-brand fw-bold">
          My Recipe
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link href="/" className="nav-link">My Recipes</Link>
            </li>
           
            <li className="nav-item">
              <button onClick={handleLogout} className="btn btn-outline-danger ms-2">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
