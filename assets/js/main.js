// 虾蛋菜谱网站 - 主入口文件
import { RecipeManager } from './modules/recipe-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { StorageManager } from './modules/storage-manager.js';

class App {
    constructor() {
        this.recipeManager = new RecipeManager();
        this.uiManager = new UIManager(this.recipeManager);
        this.storageManager = new StorageManager();
        
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            
            // 初始化存储
            await this.storageManager.init();
            
            // 加载菜谱数据
            const recipes = await this.storageManager.loadRecipes();
            this.recipeManager.setRecipes(recipes);
            
            // 初始化UI
            await this.uiManager.init();
            
            // 渲染菜谱列表
            this.uiManager.renderRecipeList(this.recipeManager.getRecipes());
            
            this.hideLoading();
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.hideLoading();
            this.uiManager.showError('应用初始化失败，请刷新页面重试');
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'flex';
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    new App();
});