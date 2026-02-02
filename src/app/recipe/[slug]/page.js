'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function RecipeDetailPage() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (!slug) return;

    const fetchRecipe = async () => {
      try {
        const res = await fetch(`/api/recipe/${slug}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.status === 401) {
          localStorage.removeItem('token');
          setLoading(false);
          router.push('/login');
          return;
        }
        if (!res.ok) {
          setError(data.message || 'Recipe not found');
          setRecipe(null);
        } else {
          setRecipe(data);
        }
      } catch (err) {
        setError('Failed to load recipe');
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [slug, router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 text-center">Loading recipe...</div>
      </>
    );
  }

  if (error || !recipe) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="alert alert-danger">{error || 'Recipe not found'}</div>
          <Link href="/" className="btn btn-primary">Back to My Recipes</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        <Link href="/" className="btn btn-outline-secondary mb-3">← Back to My Recipes</Link>

        <div className="card shadow">
          <div className="card-body p-4">
            <span className="badge bg-primary mb-2">{recipe.category}</span>
            <h1 className="card-title mb-2">{recipe.title}</h1>
            <p className="text-muted mb-4">By: {recipe.userId?.name || 'Anonymous'}</p>

            <h5 className="mt-4">Ingredients</h5>
            <ul className="list-group list-group-flush mb-4">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="list-group-item">{ing}</li>
              ))}
            </ul>

            <h5 className="mt-4">Instructions</h5>
            <div className="card bg-light p-3">
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{recipe.instructions}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
