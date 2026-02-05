'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function RecipeDetailPage() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '',
    ingredientsText: '',
    instructions: '',
  });

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

    const allRecipesData = sessionStorage.getItem('allRecipes');
    if (allRecipesData) {
      try {
        const allRecipes = JSON.parse(allRecipesData);
        const cached = allRecipes.find(r => r.slug === slug || r._id === slug);
        if (cached) {
          setRecipe(cached);
          setForm({
            title: cached.title || '',
            category: cached.category || '',
            ingredientsText: Array.isArray(cached.ingredients)
              ? cached.ingredients.join('\n')
              : '',
            instructions: cached.instructions || '',
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }

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
          setForm({
            title: data.title || '',
            category: data.category || '',
            ingredientsText: Array.isArray(data.ingredients)
              ? data.ingredients.join('\n')
              : '',
            instructions: data.instructions || '',
          });
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

  const handleDelete = async () => {
    if (deleting) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this recipe permanently?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setDeleting(true);
      setError('');
      setSuccessMessage('');

      const res = await fetch(`/api/recipe/${slug}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        setError(data.message || 'Failed to delete recipe');
        return;
      }

      sessionStorage.removeItem('allRecipes');
      setSuccessMessage('Recipe deleted successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError('Failed to delete recipe');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditToggle = () => {
    if (!recipe) return;
    if (!isEditing) {
      setForm({
        title: recipe.title || '',
        category: recipe.category || '',
        ingredientsText: Array.isArray(recipe.ingredients)
          ? recipe.ingredients.join('\n')
          : '',
        instructions: recipe.instructions || '',
      });
      setSuccessMessage('');
      setError('');
    }
    setIsEditing(!isEditing);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const ingredientsArray = form.ingredientsText
        .split('\n')
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const res = await fetch(`/api/recipe/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          ingredients: ingredientsArray,
          instructions: form.instructions,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!res.ok) {
        setError(data.message || 'Failed to update recipe');
        return;
      }

      setRecipe(data);
      setIsEditing(false);
      setSuccessMessage('Recipe updated successfully.');

      const allRecipesData = sessionStorage.getItem('allRecipes');
      if (allRecipesData) {
        try {
          const allRecipes = JSON.parse(allRecipesData);
          const updatedRecipes = allRecipes.map(r => r._id === data._id ? data : r);
          sessionStorage.setItem('allRecipes', JSON.stringify(updatedRecipes));
        } catch (e) {
          sessionStorage.removeItem('allRecipes');
        }
      }

      if (data.slug && data.slug !== slug) {
        router.replace(`/recipe/${data.slug}`);
      }
    } catch (err) {
      setError('Failed to update recipe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-5 text-center">Loading recipe...</div>
      </>
    );
  }

  if (error && !recipe) {
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

  if (!recipe) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="alert alert-danger">Recipe not found</div>
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

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}
        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}

        <div className="card shadow">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="badge bg-primary mb-2">{recipe.category}</span>
                <h1 className="card-title mb-2">{recipe.title}</h1>
                <p className="text-muted mb-0">By: {recipe.userId?.name || 'Anonymous'}</p>
              </div>
              {!isEditing && (
                <div className="ms-3 d-flex flex-column flex-md-row gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleEditToggle}
                    disabled={deleting}
                  >
                    <i className="bi bi-pencil-square me-1"></i>
                    Edit 
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-1"></i>
                        Delete 
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit}>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Ingredients (one per line)</label>
                  <textarea
                    className="form-control"
                    rows="6"
                    value={form.ingredientsText}
                    onChange={(e) => setForm({ ...form, ingredientsText: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Instructions</label>
                  <textarea
                    className="form-control"
                    rows="8"
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    required
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleEditToggle}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h5 className="mt-4">Ingredients</h5>
                <div className="card bg-light p-3 mb-4">
                  <ul className="list-unstyled mb-0">
                    {recipe.ingredients?.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>

                <h5 className="mt-4">Instructions</h5>
                <div className="card bg-light p-3">
                  <ol className="mb-0">
                    {recipe.instructions?.split('\n').filter(step => step.trim()).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
