import mongoose from 'mongoose';

const RecipeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Please provide a title'], 
    maxlength: [60, 'Title cannot be more than 60 characters'],
  },
  slug: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Please select or enter a category'],
    trim: true,
  },
  ingredients: {
    type: [String], 
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Per-user unique slug: same slug allowed for different users
RecipeSchema.index({ userId: 1, slug: 1 }, { unique: true });

// Export as a function to avoid Turbopack import issues
export function getRecipeModel() {
  return mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
}
