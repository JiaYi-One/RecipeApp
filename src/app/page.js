'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const pathname = usePathname();

  const recipesPerPage = 9;

  const categories = ['All', 'Cake', 'Dessert', 'Drink', 'Main', 'Other'];

  const getCategoryColor = (category) => {
    const colors = {
      'All': 'secondary',
      'Cake': 'danger',
      'Dessert': 'warning',
      'Drink': 'info',
      'Main': 'success',
      'Other': 'dark'
    };
    const categoryKey = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return colors[categoryKey] || 'dark';
  };

  const handleDelete = async (recipe) => {
    if (deletingId) return;
    if (typeof window !== 'undefined' && !window.confirm(`Delete "${recipe.title}" permanently?`)) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const slugOrId = recipe.slug || recipe._id;
    setDeletingId(recipe._id);
    try {
      const res = await fetch(`/api/recipe/${slugOrId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      if (res.ok) {
        const updatedRecipes = recipes.filter((r) => r._id !== recipe._id);
        setRecipes(updatedRecipes);
        sessionStorage.setItem('allRecipes', JSON.stringify(updatedRecipes));
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const fetchRecipes = useCallback(async (isRetry = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/uploadRecipe', { headers });
      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      if (res.status === 500 && !isRetry) {
        setTimeout(() => fetchRecipes(true), 1500);
        return;
      }
      if (res.status === 500) {
        setRecipes([]);
        setLoading(false);
        return;
      }
      const recipesData = Array.isArray(data) ? data : [];
      setRecipes(recipesData);
      sessionStorage.setItem('allRecipes', JSON.stringify(recipesData));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch:', error);
      if (!isRetry) {
        setTimeout(() => fetchRecipes(true), 1500);
        return;
      }
      setRecipes([]);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const cachedRecipes = sessionStorage.getItem('allRecipes');
    if (cachedRecipes) {
      try {
        const parsed = JSON.parse(cachedRecipes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecipes(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }

    setLoading(true);
    fetchRecipes();
  }, [pathname, router, fetchRecipes]);

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchText.toLowerCase());
    
    const standardCategories = ['cake', 'dessert', 'drink', 'main'];
    const recipeCategory = recipe.category.toLowerCase();
    const isStandardCategory = standardCategories.includes(recipeCategory);
    
    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Other') {
      matchesCategory = !isStandardCategory;
    } else {
      matchesCategory = recipeCategory === selectedCategory.toLowerCase();
    }
    
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const indexOfLastRecipe = currentPage * recipesPerPage;
  const indexOfFirstRecipe = indexOfLastRecipe - recipesPerPage;
  const currentRecipes = filteredRecipes.slice(indexOfFirstRecipe, indexOfLastRecipe);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedCategory]);

  if (loading) return <div className="container mt-5 text-center">Loading Recipes...</div>;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        {deleteSuccess && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            Recipe deleted successfully!
            <button type="button" className="btn-close" onClick={() => setDeleteSuccess(false)}></button>
          </div>
        )}
        
        <div className="d-flex justify-content-end mb-3">
          <a href="/recipe/upload" className="btn btn-success">Add New Recipe</a>
        </div>

        <div className="mb-4">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8 col-12">
              <div className="input-group mb-3">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search recipes by title..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {searchText && (
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => setSearchText('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap justify-content-center">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
        {filteredRecipes.length === 0 ? (
          <p className="text-center">
            {recipes.length === 0 
              ? 'No recipes found. Add your first recipe now!' 
              : 'No recipes match your search. Try different keywords or filters.'}
          </p>
        ) : (
          currentRecipes.map((recipe) => (
            <div className="col-md-4 mb-4" key={recipe._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge bg-${getCategoryColor(recipe.category)}`}>{recipe.category}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      title="Delete recipe"
                      disabled={deletingId === recipe._id}
                      onClick={() => handleDelete(recipe)}
                    >
                      {deletingId === recipe._id ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : (
                        <i className="bi bi-trash"></i>
                      )}
                    </button>
                  </div>
                  <h5 className="card-title">{recipe.title}</h5>
                  <p className="card-text text-muted">
                    By: {recipe.userId?.name || 'Anonymous'}
                  </p>
                  <hr />
                  <h6>Ingredients:</h6>
                  <ul className="small">
                    {recipe.ingredients.slice(0, 3).map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                    {recipe.ingredients.length > 3 && <li>...and more</li>}
                  </ul>
                </div>
                <div className="card-footer bg-white border-top-0">
                  <Link 
                    href={`/recipe/${recipe.slug || recipe._id}`} 
                    className="btn btn-outline-primary w-100"
                  >
                    View Full Recipe
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
        </div>

        {filteredRecipes.length > recipesPerPage && (
          <div className="d-flex justify-content-center mt-4">
            <nav>
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {[...Array(totalPages)].map((_, index) => (
                  <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}