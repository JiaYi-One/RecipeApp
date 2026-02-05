'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function UploadRecipe() {
  const [categoryType, setCategoryType] = useState('default');
  const [recipe, setRecipe] = useState({
    title: '',
    category: '',
    ingredients: '',
    instructions: ''
  });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const defaultCategories = ['Dessert', 'Cake', 'Drink', 'Main'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const ingredientsArray = recipe.ingredients
      .split('\n')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const recipeData = {
      ...recipe,
      ingredients: ingredientsArray
    };

    const res = await fetch('/api/uploadRecipe', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(recipeData),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setMessage('Recipe uploaded successfully!');
      sessionStorage.removeItem('allRecipes');
      setTimeout(() => router.push('/'), 2000);
    } else {
      setSuccess(false);
      setMessage(data.message || 'Upload failed');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8 card p-4 shadow">
          <h2 className="text-center mb-4">Upload New Recipe</h2>
          
          {message && (
            <div className={`alert ${success ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Recipe Title</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g., Chocolate Chip Cookies"
                value={recipe.title}
                onChange={(e) => setRecipe({...recipe, title: e.target.value})}
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Category</label>
              
              {categoryType === 'default' ? (
                <select 
                  className="form-select"
                  value={recipe.category}
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setCategoryType('custom');
                      setRecipe({...recipe, category: ''});
                    } else {
                      setRecipe({...recipe, category: e.target.value});
                    }
                  }}
                  required
                >
                  <option value="" disabled>Choose a category</option>
                  {defaultCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="Other">Other (Type your own...)</option>
                </select>
              ) : (
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter custom category"
                    value={recipe.category}
                    onChange={(e) => setRecipe({...recipe, category: e.target.value})}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button" 
                    onClick={() => {
                      setCategoryType('default');
                      setRecipe({...recipe, category: 'Dessert'});
                    }}
                  >
                    Back to List
                  </button>
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Ingredients (one per line)</label>
              <textarea 
                className="form-control" 
                rows="6"
                placeholder={"2 cups flour\n1 cup sugar\n3 eggs"}                value={recipe.ingredients}
                onChange={(e) => setRecipe({...recipe, ingredients: e.target.value})}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Instructions</label>
              <textarea 
                className="form-control" 
                rows="8"
                placeholder="Describe the cooking steps..."
                value={recipe.instructions}
                onChange={(e) => setRecipe({...recipe, instructions: e.target.value})}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">Upload Recipe</button>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
