// 菜谱管理模块 - 负责菜谱数据的CRUD操作
export class RecipeManager {
    constructor() {
        this.recipes = [];
        this.currentId = 1;
    }

    // 设置菜谱列表
    setRecipes(recipes) {
        this.recipes = recipes || [];
        if (this.recipes.length > 0) {
            this.currentId = Math.max(...this.recipes.map(r => parseInt(r.id) || 0)) + 1;
        }
    }

    // 获取所有菜谱
    getRecipes() {
        return [...this.recipes];
    }

    // 根据ID获取菜谱
    getRecipeById(id) {
        return this.recipes.find(recipe => recipe.id === id);
    }

    // 添加新菜谱
    addRecipe(recipeData) {
        const newRecipe = {
            id: this.currentId.toString(),
            name: recipeData.name.trim(),
            image: recipeData.image || null,
            ingredients: recipeData.ingredients || [],
            instructions: recipeData.instructions.trim(),
            cookingTime: parseInt(recipeData.cookingTime) || 0,
            calories: recipeData.calories ? parseInt(recipeData.calories) : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 验证必填字段
        if (!newRecipe.name || !newRecipe.instructions || newRecipe.cookingTime <= 0) {
            throw new Error('请填写所有必填字段');
        }

        // 验证用料清单
        if (!newRecipe.ingredients || newRecipe.ingredients.length === 0) {
            throw new Error('请至少添加一种食材');
        }

        // 验证每个用料都有名称和用量
        const hasInvalidIngredient = newRecipe.ingredients.some(
            ing => !ing.name || !ing.amount
        );
        if (hasInvalidIngredient) {
            throw new Error('每种食材都需要填写名称和用量');
        }

        this.recipes.push(newRecipe);
        this.currentId++;
        return newRecipe;
    }

    // 更新菜谱
    updateRecipe(id, recipeData) {
        const index = this.recipes.findIndex(recipe => recipe.id === id);
        if (index === -1) {
            throw new Error('菜谱不存在');
        }

        const updatedRecipe = {
            ...this.recipes[index],
            name: recipeData.name.trim(),
            image: recipeData.image !== undefined ? recipeData.image : this.recipes[index].image,
            ingredients: recipeData.ingredients || this.recipes[index].ingredients,
            instructions: recipeData.instructions.trim(),
            cookingTime: parseInt(recipeData.cookingTime) || this.recipes[index].cookingTime,
            calories: recipeData.calories !== undefined ? 
                (recipeData.calories ? parseInt(recipeData.calories) : null) : 
                this.recipes[index].calories,
            updatedAt: new Date().toISOString()
        };

        // 验证必填字段
        if (!updatedRecipe.name || !updatedRecipe.instructions || updatedRecipe.cookingTime <= 0) {
            throw new Error('请填写所有必填字段');
        }

        // 验证用料清单
        if (!updatedRecipe.ingredients || updatedRecipe.ingredients.length === 0) {
            throw new Error('请至少添加一种食材');
        }

        // 验证每个用料都有名称和用量
        const hasInvalidIngredient = updatedRecipe.ingredients.some(
            ing => !ing.name || !ing.amount
        );
        if (hasInvalidIngredient) {
            throw new Error('每种食材都需要填写名称和用量');
        }

        this.recipes[index] = updatedRecipe;
        return updatedRecipe;
    }

    // 删除菜谱
    deleteRecipe(id) {
        const index = this.recipes.findIndex(recipe => recipe.id === id);
        if (index === -1) {
            throw new Error('菜谱不存在');
        }

        const deletedRecipe = this.recipes[index];
        this.recipes.splice(index, 1);
        return deletedRecipe;
    }

    // 搜索菜谱
    searchRecipes(query) {
        if (!query || query.trim() === '') {
            return this.getRecipes();
        }

        const searchTerm = query.toLowerCase().trim();
        return this.recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ing => 
                ing.name.toLowerCase().includes(searchTerm)
            ) ||
            recipe.instructions.toLowerCase().includes(searchTerm)
        );
    }

    // 排序菜谱
    sortRecipes(recipes, sortBy, sortOrder) {
        const sortedRecipes = [...recipes];
        
        sortedRecipes.sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'cookingTime':
                    valueA = a.cookingTime;
                    valueB = b.cookingTime;
                    break;
                case 'calories':
                    valueA = a.calories || 0;
                    valueB = b.calories || 0;
                    break;
                case 'createdAt':
                default:
                    valueA = new Date(a.createdAt);
                    valueB = new Date(b.createdAt);
                    break;
            }

            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        return sortedRecipes;
    }

    // 获取过滤和排序后的菜谱
    getFilteredAndSortedRecipes(query, sortBy, sortOrder) {
        let recipes = this.searchRecipes(query);
        return this.sortRecipes(recipes, sortBy, sortOrder);
    }

    // 获取统计数据
    getStats() {
        return {
            totalRecipes: this.recipes.length,
            totalCookingTime: this.recipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0),
            totalCalories: this.recipes.reduce((sum, recipe) => sum + (recipe.calories || 0), 0),
            averageCookingTime: this.recipes.length > 0 ? 
                Math.round(this.recipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0) / this.recipes.length) : 0,
            averageCalories: this.recipes.length > 0 ? 
                Math.round(this.recipes.reduce((sum, recipe) => sum + (recipe.calories || 0), 0) / this.recipes.length) : 0
        };
    }

    // 导出数据
    exportData() {
        return {
            recipes: this.recipes,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    // 导入数据
    importData(data) {
        if (!data || !data.recipes || !Array.isArray(data.recipes)) {
            throw new Error('导入数据格式错误');
        }

        // 验证数据格式
        const validRecipes = data.recipes.filter(recipe => 
            recipe.id && recipe.name && recipe.instructions && recipe.cookingTime
        );

        this.recipes = validRecipes;
        
        // 更新currentId
        if (validRecipes.length > 0) {
            this.currentId = Math.max(...validRecipes.map(r => parseInt(r.id) || 0)) + 1;
        } else {
            this.currentId = 1;
        }

        return {
            imported: validRecipes.length,
            skipped: data.recipes.length - validRecipes.length
        };
    }
}