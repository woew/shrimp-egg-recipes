/**
 * 状态管理模块
 * 实现全局状态管理和localStorage数据持久化
 */

// 数据模型定义
const RecipeModel = {
  id: '',           // 唯一标识符
  name: '',         // 菜名
  image: '',        // 菜品图片Base64
  ingredients: [],  // 用料清单 [{name, amount}]
  steps: '',        // 制作步骤
  duration: 0,      // 制作时长（分钟）
  calories: 0,      // 卡路里（千卡）
  createdAt: '',    // 创建时间
  updatedAt: ''     // 更新时间
};

// 全局状态
class Store {
  constructor() {
    this.state = {
      recipes: [],           // 所有菜谱
      currentView: 'list',   // 当前视图: list, detail, form
      selectedRecipe: null,  // 当前选中的菜谱
      editingRecipe: null,   // 正在编辑的菜谱
      searchQuery: '',       // 搜索关键词
      sortBy: 'createdAt',   // 排序字段
      loading: false,        // 加载状态
      error: null           // 错误信息
    };
    
    this.listeners = [];     // 状态变更监听器
    this.init();
  }

  // 初始化，从localStorage加载数据
  init() {
    try {
      const savedData = localStorage.getItem('shrimpEggRecipes');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.state.recipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];
        this.state.sortBy = parsed.settings?.sortBy || 'createdAt';
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      this.showToast('数据加载失败，请刷新页面重试', 'error');
    }
  }

  // 保存数据到localStorage
  save() {
    try {
      const dataToSave = {
        recipes: this.state.recipes,
        settings: {
          sortBy: this.state.sortBy
        },
        metadata: {
          version: '1.0',
          lastUpdated: new Date().toISOString()
        }
      };
      localStorage.setItem('shrimpEggRecipes', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      this.showToast('数据保存失败，请检查存储空间', 'error');
    }
  }

  // 获取当前状态
  getState() {
    return { ...this.state };
  }

  // 设置状态并通知监听器
  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // 如果recipes发生变化，保存到localStorage
    if (updates.recipes !== undefined) {
      this.save();
    }
    
    // 通知所有监听器
    this.listeners.forEach(listener => {
      try {
        listener(this.state, prevState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  // 添加状态变更监听器
  subscribe(listener) {
    this.listeners.push(listener);
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 菜谱相关操作
  addRecipe(recipe) {
    const newRecipe = {
      ...RecipeModel,
      ...recipe,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const newRecipes = [...this.state.recipes, newRecipe];
    this.setState({ recipes: newRecipes });
    return newRecipe;
  }

  updateRecipe(updatedRecipe) {
    const newRecipes = this.state.recipes.map(recipe => 
      recipe.id === updatedRecipe.id 
        ? { ...recipe, ...updatedRecipe, updatedAt: new Date().toISOString() }
        : recipe
    );
    this.setState({ recipes: newRecipes });
  }

  deleteRecipe(recipeId) {
    const newRecipes = this.state.recipes.filter(recipe => recipe.id !== recipeId);
    this.setState({ recipes: newRecipes });
  }

  getRecipeById(recipeId) {
    return this.state.recipes.find(recipe => recipe.id === recipeId);
  }

  // 搜索和筛选
  searchRecipes(query) {
    const filtered = this.state.recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(query.toLowerCase())
    );
    return this.sortRecipes(filtered);
  }

  sortRecipes(recipes = this.state.recipes) {
    const sorted = [...recipes];
    switch (this.state.sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'duration':
        return sorted.sort((a, b) => a.duration - b.duration);
      case 'calories':
        return sorted.sort((a, b) => a.calories - b.calories);
      case 'createdAt':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  // 数据导入/导出
  exportData() {
    const data = {
      recipes: this.state.recipes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.recipes)) {
        this.setState({ recipes: data.recipes });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // 工具方法
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  showToast(message, type = 'info') {
    // 创建自定义事件，由UI组件监听
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: { message, type }
    }));
  }

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 验证菜谱数据
  validateRecipe(recipe) {
    const errors = {};
    
    if (!recipe.name || recipe.name.trim().length === 0) {
      errors.name = '菜名不能为空';
    } else if (recipe.name.length > 30) {
      errors.name = '菜名不能超过30个字符';
    }
    
    if (!recipe.steps || recipe.steps.trim().length === 0) {
      errors.steps = '制作步骤不能为空';
    }
    
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      errors.ingredients = '至少需要添加一种用料';
    } else {
      const invalidIngredients = recipe.ingredients.filter(
        ing => !ing.name || !ing.amount || ing.name.trim() === '' || ing.amount.trim() === ''
      );
      if (invalidIngredients.length > 0) {
        errors.ingredients = '请填写完整的用料信息';
      }
    }
    
    if (recipe.duration && (recipe.duration < 1 || recipe.duration > 999)) {
      errors.duration = '制作时长必须在1-999分钟之间';
    }
    
    if (recipe.calories && (recipe.calories < 0 || recipe.calories > 9999)) {
      errors.calories = '卡路里必须在0-9999千卡之间';
    }
    
    return errors;
  }
}

// 创建全局store实例
const store = new Store();

// 导出供其他模块使用
export default store;
export { RecipeModel };