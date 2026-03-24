// 虾蛋菜谱网站 - 状态管理模块
export class RecipeStore {
    constructor() {
        this.storageKey = 'shrimpEggRecipes';
        this.recipes = this.loadFromStorage();
    }

    // 从本地存储加载数据
    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('加载本地存储数据失败:', error);
            return [];
        }
    }

    // 保存数据到本地存储
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.recipes));
            return true;
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            return false;
        }
    }

    // 获取所有菜谱
    getAllRecipes() {
        return [...this.recipes];
    }

    // 根据ID获取单个菜谱
    getRecipeById(id) {
        return this.recipes.find(recipe => recipe.id === id);
    }

    // 添加新菜谱
    addRecipe(recipe) {
        if (!recipe || !recipe.id) {
            throw new Error('无效的菜谱数据');
        }
        
        // 检查ID是否已存在
        if (this.recipes.some(r => r.id === recipe.id)) {
            throw new Error('菜谱ID已存在');
        }
        
        this.recipes.push(recipe);
        this.saveToStorage();
        return recipe;
    }

    // 更新现有菜谱
    updateRecipe(updatedRecipe) {
        if (!updatedRecipe || !updatedRecipe.id) {
            throw new Error('无效的菜谱数据');
        }
        
        const index = this.recipes.findIndex(recipe => recipe.id === updatedRecipe.id);
        if (index === -1) {
            throw new Error('菜谱不存在');
        }
        
        this.recipes[index] = { ...this.recipes[index], ...updatedRecipe };
        this.saveToStorage();
        return this.recipes[index];
    }

    // 删除菜谱
    deleteRecipe(id) {
        const index = this.recipes.findIndex(recipe => recipe.id === id);
        if (index === -1) {
            throw new Error('菜谱不存在');
        }
        
        const deletedRecipe = this.recipes.splice(index, 1)[0];
        this.saveToStorage();
        return deletedRecipe;
    }

    // 搜索菜谱
    searchRecipes(query) {
        if (!query || typeof query !== 'string') {
            return this.getAllRecipes();
        }
        
        const searchTerm = query.toLowerCase().trim();
        return this.recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.instructions.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ing => 
                ing.name.toLowerCase().includes(searchTerm) ||
                ing.amount.toLowerCase().includes(searchTerm)
            )
        );
    }

    // 按字段排序菜谱
    sortRecipes(field, order = 'asc') {
        const sortedRecipes = [...this.recipes];
        
        sortedRecipes.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];
            
            // 处理不同类型的排序
            if (field === 'name') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            } else if (field === 'createdAt' || field === 'updatedAt') {
                valueA = new Date(valueA);
                valueB = new Date(valueB);
            } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                // 数字直接比较
            } else {
                // 其他类型转为字符串比较
                valueA = String(valueA);
                valueB = String(valueB);
            }
            
            if (order === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
        
        return sortedRecipes;
    }

    // 导出数据
    exportData() {
        return {
            recipes: this.getAllRecipes(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    // 导入数据
    importData(data) {
        if (!data || !Array.isArray(data.recipes)) {
            throw new Error('无效的数据格式');
        }
        
        // 验证数据格式
        const validRecipes = data.recipes.filter(recipe => 
            recipe && 
            recipe.id && 
            recipe.name && 
            recipe.cookingTime && 
            recipe.instructions &&
            Array.isArray(recipe.ingredients)
        );
        
        if (validRecipes.length === 0) {
            throw new Error('没有有效的菜谱数据');
        }
        
        // 处理可能的ID冲突
        const existingIds = new Set(this.recipes.map(r => r.id));
        validRecipes.forEach(recipe => {
            if (existingIds.has(recipe.id)) {
                recipe.id = recipe.id + '_' + Date.now();
            }
        });
        
        this.recipes = [...this.recipes, ...validRecipes];
        this.saveToStorage();
        return validRecipes.length;
    }

    // 清空所有数据
    clearAll() {
        this.recipes = [];
        this.saveToStorage();
    }

    // 获取统计信息
    getStats() {
        return {
            totalRecipes: this.recipes.length,
            totalIngredients: this.recipes.reduce((sum, recipe) => sum + recipe.ingredients.length, 0),
            averageCookingTime: this.recipes.length > 0 
                ? Math.round(this.recipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0) / this.recipes.length)
                : 0,
            latestRecipe: this.recipes.length > 0 
                ? this.recipes.reduce((latest, recipe) => 
                    new Date(recipe.createdAt) > new Date(latest.createdAt) ? recipe : latest
                )
                : null
        };
    }

    // 备份数据
    backupData() {
        const backup = {
            recipes: this.getAllRecipes(),
            backupDate: new Date().toISOString(),
            backupVersion: '1.0'
        };
        
        try {
            const backupKey = `${this.storageKey}_backup_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(backup));
            return backupKey;
        } catch (error) {
            console.error('创建备份失败:', error);
            return null;
        }
    }

    // 从备份恢复
    restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('备份不存在');
            }
            
            const backup = JSON.parse(backupData);
            if (backup.recipes && Array.isArray(backup.recipes)) {
                this.recipes = backup.recipes;
                this.saveToStorage();
                return true;
            }
            
            throw new Error('无效的备份格式');
        } catch (error) {
            console.error('恢复备份失败:', error);
            return false;
        }
    }
}