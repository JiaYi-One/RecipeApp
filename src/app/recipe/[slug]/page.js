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
    // Simple browser confirm to avoid accidental deletes
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

      // On successful delete, go back to main recipes page
      router.push('/');
    } catch (err) {
      setError('Failed to delete recipe');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditToggle = () => {
    if (!recipe) return;
    // Reset form to latest recipe values every time edit starts
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

      // If slug changed on the server, update the URL so future refreshes work
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
              <div className="ms-3 d-flex flex-column flex-md-row gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleEditToggle}
                  disabled={deleting}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Recipe'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Recipe'}
                </button>
              </div>
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
