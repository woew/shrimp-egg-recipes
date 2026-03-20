// UI管理模块 - 负责所有界面交互和渲染
import { RecipeManager } from './recipe-manager.js';

export class UIManager {
    constructor(recipeManager) {
        this.recipeManager = recipeManager;
        this.currentEditingRecipe = null;
        this.currentImageData = null;
        
        this.initElements();
        this.bindEvents();
    }

    init() {
        this.setupSearchAndSort();
        this.setupModalEvents();
        this.setupFormEvents();
        this.setupImageUpload();
    }

    initElements() {
        // 主要元素
        this.recipeGrid = document.getElementById('recipeGrid');
        this.emptyState = document.getElementById('emptyState');
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');
        
        // 模态框元素
        this.recipeModal = document.getElementById('recipeModal');
        this.detailModal = document.getElementById('detailModal');
        this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
        
        // 表单元素
        this.recipeForm = document.getElementById('recipeForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.recipeName = document.getElementById('recipeName');
        this.instructions = document.getElementById('instructions');
        this.cookingTime = document.getElementById('cookingTime');
        this.calories = document.getElementById('calories');
        
        // 图片上传元素
        this.imageInput = document.getElementById('imageInput');
        this.imageUploadArea = document.getElementById('imageUploadArea');
        this.uploadPlaceholder = document.getElementById('uploadPlaceholder');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImage = document.getElementById('previewImage');
        this.removeImage = document.getElementById('removeImage');
        
        // 详情模态框元素
        this.detailTitle = document.getElementById('detailTitle');
        this.detailContent = document.getElementById('detailContent');
    }

    bindEvents() {
        // 添加按钮事件
        document.getElementById('addRecipeBtn').addEventListener('click', () => {
            this.openAddModal();
        });

        // 模态框关闭事件
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal(this.recipeModal);
        });

        document.getElementById('closeDetail').addEventListener('click', () => {
            this.closeModal(this.detailModal);
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal(this.recipeModal);
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeModal(this.deleteConfirmModal);
        });

        // 表单提交事件
        this.recipeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 详情页面按钮事件
        document.getElementById('editBtn').addEventListener('click', () => {
            this.editCurrentRecipe();
        });

        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.closeModal(this.detailModal);
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.deleteCurrentRecipe();
        });

        // 图片移除事件
        this.removeImage.addEventListener('click', () => {
            this.removeCurrentImage();
        });

        // 点击模态框背景关闭
        [this.recipeModal, this.detailModal, this.deleteConfirmModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                [this.recipeModal, this.detailModal, this.deleteConfirmModal].forEach(modal => {
                    if (modal.style.display === 'flex') {
                        this.closeModal(modal);
                    }
                });
            }
        });
    }

    setupSearchAndSort() {
        let searchTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.handleSearchAndSort();
            }, 300);
        });

        this.sortSelect.addEventListener('change', () => {
            this.handleSearchAndSort();
        });
    }

    setupModalEvents() {
        // 已在bindEvents中设置
    }

    setupFormEvents() {
        // 已在bindEvents中设置
    }

    setupImageUpload() {
        // 点击上传区域触发文件选择
        this.imageUploadArea.addEventListener('click', () => {
            this.imageInput.click();
        });

        // 拖拽上传
        this.imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageUploadArea.style.borderColor = 'var(--primary-pink)';
            this.imageUploadArea.style.backgroundColor = 'rgba(255, 107, 157, 0.05)';
        });

        this.imageUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.imageUploadArea.style.borderColor = 'var(--border-color)';
            this.imageUploadArea.style.backgroundColor = 'transparent';
        });

        this.imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageUploadArea.style.borderColor = 'var(--border-color)';
            this.imageUploadArea.style.backgroundColor = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageFile(files[0]);
            }
        });

        // 文件选择事件
        this.imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageFile(e.target.files[0]);
            }
        });
    }

    handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('请选择图片文件');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB限制
            this.showError('图片大小不能超过10MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageData = e.target.result;
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageData) {
        this.previewImage.src = imageData;
        this.uploadPlaceholder.style.display = 'none';
        this.imagePreview.style.display = 'block';
    }

    removeCurrentImage() {
        this.currentImageData = null;
        this.previewImage.src = '';
        this.imagePreview.style.display = 'none';
        this.uploadPlaceholder.style.display = 'block';
        this.imageInput.value = '';
    }

    openAddModal() {
        this.currentEditingRecipe = null;
        this.modalTitle.textContent = '添加新菜谱';
        this.resetForm();
        this.openModal(this.recipeModal);
    }

    openEditModal(recipe) {
        this.currentEditingRecipe = recipe;
        this.modalTitle.textContent = '编辑菜谱';
        this.fillForm(recipe);
        this.openModal(this.recipeModal);
    }

    openDetailModal(recipe) {
        this.currentEditingRecipe = recipe;
        this.detailTitle.textContent = recipe.name;
        this.renderRecipeDetail(recipe);
        this.openModal(this.detailModal);
    }

    openModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (modal === this.recipeModal) {
            this.resetForm();
        }
    }

    resetForm() {
        this.recipeForm.reset();
        this.removeCurrentImage();
        this.clearIngredientsList();
        this.addIngredientRow(); // 添加一个空的用料行
    }

    fillForm(recipe) {
        this.recipeName.value = recipe.name;
        this.instructions.value = recipe.instructions;
        this.cookingTime.value = recipe.cookingTime;
        this.calories.value = recipe.calories || '';

        // 设置图片
        if (recipe.image) {
            this.currentImageData = recipe.image;
            this.showImagePreview(recipe.image);
        } else {
            this.removeCurrentImage();
        }

        // 设置用料清单
        this.clearIngredientsList();
        recipe.ingredients.forEach(ingredient => {
            this.addIngredientRow(ingredient.name, ingredient.amount);
        });
    }

    clearIngredientsList() {
        const ingredientsList = document.getElementById('ingredientsList');
        ingredientsList.innerHTML = '';
    }

    addIngredientRow(name = '', amount = '') {
        const ingredientsList = document.getElementById('ingredientsList');
        const ingredientItem = document.createElement('div');
        ingredientItem.className = 'ingredient-item';
        ingredientItem.innerHTML = `
            <input type="text" placeholder="食材名称" class="ingredient-name" value="${name}" required>
            <input type="text" placeholder="用量" class="ingredient-amount" value="${amount}" required>
            <button type="button" class="remove-ingredient" onclick="this.parentElement.remove()">×</button>
        `;
        ingredientsList.appendChild(ingredientItem);
    }

    handleFormSubmit() {
        try {
            const formData = this.collectFormData();
            
            if (this.currentEditingRecipe) {
                // 编辑模式
                const updatedRecipe = this.recipeManager.updateRecipe(
                    this.currentEditingRecipe.id, 
                    formData
                );
                this.showSuccess('菜谱更新成功！');
            } else {
                // 添加模式
                const newRecipe = this.recipeManager.addRecipe(formData);
                this.showSuccess('菜谱添加成功！');
            }

            this.closeModal(this.recipeModal);
            this.handleSearchAndSort();
        } catch (error) {
            this.showError(error.message);
        }
    }

    collectFormData() {
        const ingredients = [];
        const ingredientItems = document.querySelectorAll('.ingredient-item');
        
        ingredientItems.forEach(item => {
            const name = item.querySelector('.ingredient-name').value.trim();
            const amount = item.querySelector('.ingredient-amount').value.trim();
            if (name && amount) {
                ingredients.push({ name, amount });
            }
        });

        return {
            name: this.recipeName.value.trim(),
            image: this.currentImageData,
            ingredients: ingredients,
            instructions: this.instructions.value.trim(),
            cookingTime: parseInt(this.cookingTime.value),
            calories: this.calories.value ? parseInt(this.calories.value) : null
        };
    }

    handleSearchAndSort() {
        const query = this.searchInput.value;
        const [sortBy, sortOrder] = this.sortSelect.value.split('-');
        
        const recipes = this.recipeManager.getFilteredAndSortedRecipes(query, sortBy, sortOrder);
        this.renderRecipeList(recipes);
    }

    renderRecipeList(recipes) {
        this.recipeGrid.innerHTML = '';
        
        if (recipes.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        recipes.forEach(recipe => {
            const card = this.createRecipeCard(recipe);
            this.recipeGrid.appendChild(card);
        });
    }

    createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.setAttribute('data-recipe-id', recipe.id);

        const imageHtml = recipe.image 
            ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">`
            : `<div class="recipe-image">🍳</div>`;

        card.innerHTML = `
            ${imageHtml}
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.name}</h3>
                <div class="recipe-meta">
                    <span>⏱️ ${recipe.cookingTime}分钟</span>
                    ${recipe.calories ? `<span>🔥 ${recipe.calories}千卡</span>` : ''}
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            const recipeData = this.recipeManager.getRecipeById(recipe.id);
            if (recipeData) {
                this.openDetailModal(recipeData);
            }
        });

        return card;
    }

    renderRecipeDetail(recipe) {
        const imageHtml = recipe.image 
            ? `<img src="${recipe.image}" alt="${recipe.name}" class="detail-image">`
            : '';

        const ingredientsHtml = recipe.ingredients.map(ing => 
            `<tr><td>${ing.name}</td><td>${ing.amount}</td></tr>`
        ).join('');

        this.detailContent.innerHTML = `
            ${imageHtml}
            
            <div class="detail-section">
                <h3>基本信息</h3>
                <p><strong>菜名：</strong>${recipe.name}</p>
                <p><strong>烹饪时长：</strong>${recipe.cookingTime}分钟</p>
                ${recipe.calories ? `<p><strong>卡路里：</strong>${recipe.calories}千卡</p>` : ''}
            </div>

            <div class="detail-section">
                <h3>用料清单</h3>
                <table class="ingredients-table">
                    <thead>
                        <tr>
                            <th>食材</th>
                            <th>用量</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ingredientsHtml}
                    </tbody>
                </table>
            </div>

            <div class="detail-section">
                <h3>详细做法</h3>
                <p style="white-space: pre-line;">${recipe.instructions}</p>
            </div>

            <div class="detail-section">
                <h3>创建信息</h3>
                <p><strong>创建时间：</strong>${new Date(recipe.createdAt).toLocaleString('zh-CN')}</p>
                <p><strong>更新时间：</strong>${new Date(recipe.updatedAt).toLocaleString('zh-CN')}</p>
            </div>
        `;
    }

    editCurrentRecipe() {
        if (this.currentEditingRecipe) {
            this.closeModal(this.detailModal);
            this.openEditModal(this.currentEditingRecipe);
        }
    }

    confirmDelete() {
        this.closeModal(this.detailModal);
        this.openModal(this.deleteConfirmModal);
    }

    deleteCurrentRecipe() {
        if (this.currentEditingRecipe) {
            try {
                this.recipeManager.deleteRecipe(this.currentEditingRecipe.id);
                this.showSuccess('菜谱删除成功！');
                this.closeModal(this.deleteConfirmModal);
                this.handleSearchAndSort();
            } catch (error) {
                this.showError(error.message);
            }
        }
    }

    showEmptyState() {
        this.emptyState.style.display = 'block';
        this.recipeGrid.style.display = 'none';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
        this.recipeGrid.style.display = 'grid';
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 3000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        if (type === 'success') {
            toast.style.backgroundColor = 'var(--mint-green)';
            toast.style.color = 'var(--text-primary)';
        } else if (type === 'error') {
            toast.style.backgroundColor = 'var(--error)';
        } else {
            toast.style.backgroundColor = 'var(--primary-pink)';
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// 添加全局函数供HTML调用
window.addIngredient = function() {
    const uiManager = window.app?.uiManager;
    if (uiManager) {
        uiManager.addIngredientRow();
    }
};