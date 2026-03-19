/**
 * 可爱动漫风格虾蛋菜谱网站 - 主JavaScript文件
 * 功能：菜谱管理、数据存储、UI交互、动画效果
 */

// 全局状态管理
class AppState {
    constructor() {
        this.recipes = [];
        this.filteredRecipes = [];
        this.searchQuery = '';
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
        this.selectedRecipe = null;
        this.isEditing = false;
        this.editingRecipeId = null;
        
        this.init();
    }

    init() {
        this.loadRecipes();
        this.setupEventListeners();
        this.render();
        this.hideLoading();
    }

    // 数据存储相关
    loadRecipes() {
        try {
            const saved = localStorage.getItem('shrimpEggRecipes');
            if (saved) {
                this.recipes = JSON.parse(saved);
            } else {
                // 添加一些示例数据
                this.addSampleRecipes();
            }
            this.filterAndSortRecipes();
        } catch (error) {
            console.error('加载菜谱失败:', error);
            this.recipes = [];
        }
    }

    saveRecipes() {
        try {
            localStorage.setItem('shrimpEggRecipes', JSON.stringify(this.recipes));
        } catch (error) {
            console.error('保存菜谱失败:', error);
            this.showToast('保存失败，请检查存储空间', 'error');
        }
    }

    addSampleRecipes() {
        const sampleRecipes = [
            {
                id: '1',
                name: '可爱虾仁滑蛋',
                image: null,
                ingredients: [
                    { name: '虾仁', amount: '200g' },
                    { name: '鸡蛋', amount: '3个' },
                    { name: '牛奶', amount: '30ml' },
                    { name: '盐', amount: '少许' }
                ],
                instructions: '1. 虾仁洗净去虾线，用少许盐和料酒腌制10分钟\n2. 鸡蛋打散，加入牛奶和少许盐\n3. 热锅下油，先炒虾仁至变色\n4. 倒入蛋液，小火慢慢推炒至嫩滑\n5. 出锅前撒上葱花即可',
                cookingTime: 15,
                calories: 280,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                name: '日式厚蛋烧虾仁',
                image: null,
                ingredients: [
                    { name: '鸡蛋', amount: '4个' },
                    { name: '虾仁', amount: '150g' },
                    { name: '糖', amount: '1小勺' },
                    { name: '味淋', amount: '1小勺' }
                ],
                instructions: '1. 虾仁切丁，用少许盐腌制\n2. 鸡蛋打散，加入糖、味淋和少许盐\n3. 热锅刷薄油，倒入1/3蛋液\n4. 放入虾仁丁，卷起蛋皮\n5. 重复2-3次，形成厚蛋烧\n6. 切块装盘',
                cookingTime: 20,
                calories: 320,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        
        this.recipes = sampleRecipes;
        this.saveRecipes();
    }

    // 菜谱CRUD操作
    addRecipe(recipe) {
        const newRecipe = {
            ...recipe,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.recipes.unshift(newRecipe);
        this.saveRecipes();
        this.filterAndSortRecipes();
        this.render();
        this.showToast('菜谱添加成功！', 'success');
    }

    updateRecipe(id, updatedRecipe) {
        const index = this.recipes.findIndex(r => r.id === id);
        if (index !== -1) {
            this.recipes[index] = {
                ...this.recipes[index],
                ...updatedRecipe,
                updatedAt: new Date().toISOString()
            };
            this.saveRecipes();
            this.filterAndSortRecipes();
            this.render();
            this.showToast('菜谱更新成功！', 'success');
        }
    }

    deleteRecipe(id) {
        this.recipes = this.recipes.filter(r => r.id !== id);
        this.saveRecipes();
        this.filterAndSortRecipes();
        this.render();
        this.showToast('菜谱删除成功！', 'success');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 搜索和排序
    filterAndSortRecipes() {
        let filtered = [...this.recipes];

        // 搜索过滤
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(recipe => 
                recipe.name.toLowerCase().includes(query) ||
                recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query))
            );
        }

        // 排序
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            switch (this.sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'cookingTime':
                    aVal = a.cookingTime;
                    bVal = b.cookingTime;
                    break;
                case 'calories':
                    aVal = a.calories || 0;
                    bVal = b.calories || 0;
                    break;
                case 'createdAt':
                default:
                    aVal = new Date(a.createdAt);
                    bVal = new Date(b.createdAt);
                    break;
            }

            if (this.sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        this.filteredRecipes = filtered;
    }

    // UI渲染
    render() {
        this.renderRecipes();
        this.updateEmptyState();
    }

    renderRecipes() {
        const grid = document.getElementById('recipesGrid');
        
        if (this.filteredRecipes.length === 0) {
            grid.innerHTML = '';
            return;
        }

        grid.innerHTML = this.filteredRecipes.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // 添加点击事件
        grid.querySelectorAll('.recipe-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.selectedRecipe = this.filteredRecipes[index];
                this.showRecipeDetail();
            });
        });
    }

    createRecipeCard(recipe) {
        const imageHtml = recipe.image 
            ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">`
            : `<div class="recipe-image">🍤</div>`;

        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                ${imageHtml}
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.name}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-meta-item">⏱️ ${recipe.cookingTime}分钟</span>
                        <span class="recipe-meta-item">🔥 ${recipe.calories || '未知'}千卡</span>
                    </div>
                    <p class="recipe-description">${recipe.instructions.substring(0, 60)}...</p>
                </div>
            </div>
        `;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const hasRecipes = this.filteredRecipes.length > 0 || this.recipes.length > 0;
        
        if (this.recipes.length === 0) {
            emptyState.style.display = 'block';
            document.getElementById('recipesGrid').style.display = 'none';
        } else if (this.filteredRecipes.length === 0 && this.searchQuery) {
            emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <h3 class="empty-title">没有找到匹配的菜谱</h3>
                <p class="empty-text">试试其他关键词吧～</p>
                <button class="empty-btn" onclick="app.clearSearch()">
                    <span class="btn-icon">✨</span>
                    清空搜索
                </button>
            `;
            emptyState.style.display = 'block';
            document.getElementById('recipesGrid').style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            document.getElementById('recipesGrid').style.display = 'grid';
        }
    }

    // 事件监听器设置
    setupEventListeners() {
        // 搜索功能
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.updateClearButton();
            this.filterAndSortRecipes();
            this.render();
        });

        sortSelect.addEventListener('change', (e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            this.sortBy = sortBy;
            this.sortOrder = sortOrder;
            this.filterAndSortRecipes();
            this.render();
        });

        // 表单提交
        document.getElementById('recipeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // 图片上传
        this.setupImageUpload();
        
        // 拖拽上传
        this.setupDragAndDrop();
    }

    setupImageUpload() {
        const imageInput = document.getElementById('imageInput');
        const uploadArea = document.getElementById('imageUploadArea');

        uploadArea.addEventListener('click', () => imageInput.click());

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleImageUpload(file);
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('imageUploadArea');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageUpload(files[0]);
            }
        });
    }

    handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('请选择图片文件', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showToast('图片大小不能超过10MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(src) {
        const preview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        const placeholder = document.querySelector('.upload-placeholder');

        previewImage.src = src;
        placeholder.style.display = 'none';
        preview.style.display = 'block';
    }

    removeImage() {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.querySelector('.upload-placeholder');
        const imageInput = document.getElementById('imageInput');

        preview.style.display = 'none';
        placeholder.style.display = 'block';
        imageInput.value = '';
    }

    // 表单处理
    handleFormSubmit() {
        if (!this.validateForm()) return;

        const formData = this.getFormData();
        
        if (this.isEditing) {
            this.updateRecipe(this.editingRecipeId, formData);
        } else {
            this.addRecipe(formData);
        }

        this.closeModal();
    }

    validateForm() {
        const name = document.getElementById('recipeName').value.trim();
        const cookingTime = document.getElementById('cookingTime').value;
        const instructions = document.getElementById('instructions').value.trim();

        let isValid = true;

        // 验证菜名
        if (!name) {
            this.showFieldError('recipeName', '请输入菜名');
            isValid = false;
        } else {
            this.hideFieldError('recipeName');
        }

        // 验证烹饪时长
        if (!cookingTime || cookingTime < 1) {
            this.showFieldError('cookingTime', '请输入有效的烹饪时长');
            isValid = false;
        } else {
            this.hideFieldError('cookingTime');
        }

        // 验证用料
        const ingredients = this.getIngredients();
        if (ingredients.length === 0) {
            this.showToast('请至少添加一种食材', 'error');
            isValid = false;
        }

        // 验证做法
        if (!instructions) {
            this.showFieldError('instructions', '请输入详细做法');
            isValid = false;
        } else {
            this.hideFieldError('instructions');
        }

        return isValid;
    }

    getFormData() {
        const imagePreview = document.getElementById('previewImage');
        
        return {
            name: document.getElementById('recipeName').value.trim(),
            image: imagePreview.src && imagePreview.src.startsWith('data:') ? imagePreview.src : null,
            ingredients: this.getIngredients(),
            instructions: document.getElementById('instructions').value.trim(),
            cookingTime: parseInt(document.getElementById('cookingTime').value),
            calories: document.getElementById('calories').value ? parseInt(document.getElementById('calories').value) : null
        };
    }

    getIngredients() {
        const items = document.querySelectorAll('.ingredient-item');
        const ingredients = [];

        items.forEach(item => {
            const name = item.querySelector('.ingredient-name').value.trim();
            const amount = item.querySelector('.ingredient-amount').value.trim();
            
            if (name && amount) {
                ingredients.push({ name, amount });
            }
        });

        return ingredients;
    }

    // 用料管理
    addIngredient() {
        const container = document.getElementById('ingredientsList');
        const newItem = document.createElement('div');
        newItem.className = 'ingredient-item';
        newItem.innerHTML = `
            <input type="text" class="ingredient-name" placeholder="食材名称" required>
            <input type="text" class="ingredient-amount" placeholder="用量" required>
            <button type="button" class="remove-ingredient" onclick="app.removeIngredient(this)">×</button>
        `;
        container.appendChild(newItem);
    }

    removeIngredient(button) {
        const items = document.querySelectorAll('.ingredient-item');
        if (items.length > 1) {
            button.parentElement.remove();
        } else {
            this.showToast('至少需要保留一种食材', 'error');
        }
    }

    // 模态框管理
    openAddForm() {
        this.isEditing = false;
        this.editingRecipeId = null;
        this.resetForm();
        document.getElementById('modalTitle').textContent = '添加新菜谱';
        this.openModal();
    }

    openEditForm(recipe) {
        this.isEditing = true;
        this.editingRecipeId = recipe.id;
        this.populateForm(recipe);
        document.getElementById('modalTitle').textContent = '编辑菜谱';
        this.openModal();
    }

    populateForm(recipe) {
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('cookingTime').value = recipe.cookingTime;
        document.getElementById('calories').value = recipe.calories || '';
        document.getElementById('instructions').value = recipe.instructions;

        // 填充用料
        const container = document.getElementById('ingredientsList');
        container.innerHTML = '';
        
        recipe.ingredients.forEach(ingredient => {
            const item = document.createElement('div');
            item.className = 'ingredient-item';
            item.innerHTML = `
                <input type="text" class="ingredient-name" value="${ingredient.name}" placeholder="食材名称" required>
                <input type="text" class="ingredient-amount" value="${ingredient.amount}" placeholder="用量" required>
                <button type="button" class="remove-ingredient" onclick="app.removeIngredient(this)">×</button>
            `;
            container.appendChild(item);
        });

        // 显示图片
        if (recipe.image) {
            this.showImagePreview(recipe.image);
        } else {
            this.removeImage();
        }
    }

    resetForm() {
        document.getElementById('recipeForm').reset();
        document.getElementById('ingredientsList').innerHTML = `
            <div class="ingredient-item">
                <input type="text" class="ingredient-name" placeholder="食材名称" required>
                <input type="text" class="ingredient-amount" placeholder="用量" required>
                <button type="button" class="remove-ingredient" onclick="app.removeIngredient(this)">×</button>
            </div>
        `;
        this.removeImage();
        this.clearErrors();
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
            error.classList.remove('show');
        });
    }

    showFieldError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    hideFieldError(fieldId) {
        const errorElement = document.getElementById(fieldId + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    openModal() {
        document.getElementById('recipeModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('recipeModal').style.display = 'none';
        document.body.style.overflow = '';
    }

    // 详情查看
    showRecipeDetail() {
        if (!this.selectedRecipe) return;

        const content = document.getElementById('detailContent');
        const recipe = this.selectedRecipe;

        const imageHtml = recipe.image 
            ? `<img src="${recipe.image}" alt="${recipe.name}" class="detail-image">`
            : '';

        const ingredientsHtml = recipe.ingredients.map(ing => 
            `<div class="ingredient-detail-item">
                <span>${ing.name}</span>
                <span>${ing.amount}</span>
            </div>`
        ).join('');

        content.innerHTML = `
            ${imageHtml}
            
            <div class="detail-section">
                <h3>基本信息</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                    <div><strong>烹饪时长：</strong>${recipe.cookingTime}分钟</div>
                    <div><strong>卡路里：</strong>${recipe.calories || '未知'}千卡</div>
                </div>
            </div>

            <div class="detail-section">
                <h3>用料清单</h3>
                <div class="ingredients-detail">
                    ${ingredientsHtml}
                </div>
            </div>

            <div class="detail-section">
                <h3>详细做法</h3>
                <div class="instructions-detail">
                    ${recipe.instructions}
                </div>
            </div>

            <div class="detail-section">
                <h3>创建信息</h3>
                <p><strong>创建时间：</strong>${new Date(recipe.createdAt).toLocaleString('zh-CN')}</p>
                <p><strong>更新时间：</strong>${new Date(recipe.updatedAt).toLocaleString('zh-CN')}</p>
            </div>
        `;

        document.getElementById('detailTitle').textContent = recipe.name;
        document.getElementById('detailModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeDetailModal() {
        document.getElementById('detailModal').style.display = 'none';
        document.body.style.overflow = '';
        this.selectedRecipe = null;
    }

    editRecipe() {
        this.closeDetailModal();
        setTimeout(() => {
            this.openEditForm(this.selectedRecipe);
        }, 300);
    }

    deleteRecipe() {
        if (!this.selectedRecipe) return;

        this.closeDetailModal();
        this.showConfirmDialog(
            '确认删除',
            `确定要删除"${this.selectedRecipe.name}"吗？此操作无法撤销。`,
            () => {
                this.deleteRecipe(this.selectedRecipe.id);
                this.selectedRecipe = null;
            }
        );
    }

    // 确认对话框
    showConfirmDialog(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        window.pendingConfirm = onConfirm;
        document.getElementById('confirmModal').style.display = 'flex';
    }

    // 搜索和清除
    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.searchQuery = '';
        this.filterAndSortRecipes();
        this.render();
        this.updateClearButton();
    }

    updateClearButton() {
        const clearBtn = document.querySelector('.clear-search');
        clearBtn.style.display = this.searchQuery ? 'block' : 'none';
    }

    // 数据导入导出
    exportData() {
        const data = {
            recipes: this.recipes,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `虾蛋菜谱_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('数据导出成功！', 'success');
    }

    importData() {
        document.getElementById('importFile').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.recipes && Array.isArray(data.recipes)) {
                    this.recipes = data.recipes;
                    this.saveRecipes();
                    this.filterAndSortRecipes();
                    this.render();
                    this.showToast('数据导入成功！', 'success');
                } else {
                    this.showToast('文件格式不正确', 'error');
                }
            } catch (error) {
                this.showToast('文件解析失败', 'error');
            }
        };
        reader.readAsText(file);
        
        event.target.value = '';
    }

    // 提示消息
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const messageEl = document.getElementById('toastMessage');
        const iconEl = document.getElementById('toastIcon');

        messageEl.textContent = message;
        iconEl.textContent = type === 'success' ? '✨' : '⚠️';
        
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    // 加载动画
    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    // 工具函数
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('zh-CN');
    }
}

// 全局函数（供HTML调用）
function openAddForm() {
    app.openAddForm();
}

function closeModal() {
    app.closeModal();
}

function closeDetailModal() {
    app.closeDetailModal();
}

function addIngredient() {
    app.addIngredient();
}

function removeIngredient(button) {
    app.removeIngredient(button);
}

function removeImage() {
    app.removeImage();
}

function clearSearch() {
    app.clearSearch();
}

function exportData() {
    app.exportData();
}

function importData() {
    app.importData();
}

function handleFileImport(event) {
    app.handleFileImport(event);
}

function editRecipe() {
    app.editRecipe();
}

function deleteRecipe() {
    app.deleteRecipe();
}

function cancelDelete() {
    document.getElementById('confirmModal').style.display = 'none';
}

function confirmDelete() {
    if (window.pendingConfirm) {
        window.pendingConfirm();
        window.pendingConfirm = null;
    }
    document.getElementById('confirmModal').style.display = 'none';
}

// 键盘事件
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = ['recipeModal', 'detailModal', 'confirmModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
});

// 点击模态框外部关闭
['recipeModal', 'detailModal', 'confirmModal'].forEach(modalId => {
    const modal = document.getElementById(modalId);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
});

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AppState();
});

// 防止页面刷新时丢失数据
window.addEventListener('beforeunload', () => {
    if (app) {
        app.saveRecipes();
    }
});