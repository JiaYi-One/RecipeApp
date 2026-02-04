'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

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
        setRecipes((prev) => prev.filter((r) => r._id !== recipe._id));
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
      // Server/DB may not be ready right after npm run dev — retry once
      if (res.status === 500 && !isRetry) {
        setTimeout(() => fetchRecipes(true), 1500);
        return;
      }
      if (res.status === 500) {
        setRecipes([]);
        setLoading(false);
        return;
      }
      setRecipes(Array.isArray(data) ? data : []);
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
    setLoading(true);
    fetchRecipes();
  }, [pathname, router, fetchRecipes]);

  if (loading) return <div className="container mt-5 text-center">Loading Recipes...</div>;

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-end mb-3">
          <a href="/recipe/upload" className="btn btn-success">Share New Recipe</a>
        </div>
        <div className="row">
        {recipes.length === 0 ? (
          <p className="text-center">No recipes found. Be the first to share!</p>
        ) : (
          recipes.map((recipe) => (
            <div className="col-md-4 mb-4" key={recipe._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary">{recipe.category}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      title="Delete recipe"
                      disabled={deletingId === recipe._id}
                      onClick={() => handleDelete(recipe)}
                    >
                      {deletingId === recipe._id ? '…' : 'Delete'}
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
                  <Link href={`/recipe/${recipe.slug || recipe._id}`} className="btn btn-outline-primary w-100">
                    View Full Recipe
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </>
  );
}