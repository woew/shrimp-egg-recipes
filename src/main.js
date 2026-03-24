// 虾蛋菜谱网站 - 主入口文件
import { RecipeStore } from './state/store.js';

// 全局状态管理
const store = new RecipeStore();

// DOM元素引用
const elements = {
    recipeGrid: document.getElementById('recipeGrid'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    addRecipeBtn: document.getElementById('addRecipeBtn'),
    recipeModal: document.getElementById('recipeModal'),
    detailModal: document.getElementById('detailModal'),
    recipeForm: document.getElementById('recipeForm'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    closeDetail: document.getElementById('closeDetail'),
    detailTitle: document.getElementById('detailTitle'),
    detailContent: document.getElementById('detailContent'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    toast: document.getElementById('toast'),
    loading: document.getElementById('loading')
};

// 应用状态
let currentState = {
    recipes: [],
    filteredRecipes: [],
    searchQuery: '',
    sortBy: 'createdAt-desc',
    selectedRecipe: null,
    isEditing: false,
    editingRecipe: null
};

// 初始化应用
function initApp() {
    loadRecipes();
    setupEventListeners();
    renderRecipes();
}

// 加载菜谱数据
function loadRecipes() {
    showLoading(true);
    try {
        currentState.recipes = store.getAllRecipes();
        applyFilters();
    } catch (error) {
        console.error('加载菜谱失败:', error);
        showToast('加载菜谱失败，请刷新页面重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索和排序
    elements.searchInput.addEventListener('input', handleSearch);
    elements.sortSelect.addEventListener('change', handleSort);
    
    // 添加菜谱
    elements.addRecipeBtn.addEventListener('click', () => openAddModal());
    
    // 模态框控制
    elements.closeModal.addEventListener('click', closeModal);
    elements.closeDetail.addEventListener('click', closeDetailModal);
    
    // 表单提交
    elements.recipeForm.addEventListener('submit', handleFormSubmit);
    
    // 数据导入导出
    elements.exportBtn.addEventListener('click', exportData);
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', importData);
    
    // 点击模态框外部关闭
    elements.recipeModal.addEventListener('click', (e) => {
        if (e.target === elements.recipeModal) closeModal();
    });
    elements.detailModal.addEventListener('click', (e) => {
        if (e.target === elements.detailModal) closeDetailModal();
    });
    
    // 图片上传
    const imageInput = document.getElementById('recipeImage');
    imageInput.addEventListener('change', handleImageUpload);
    
    // 用料清单管理
    setupIngredientHandlers();
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.recipeModal.style.display === 'block') closeModal();
            if (elements.detailModal.style.display === 'block') closeDetailModal();
        }
    });
}

// 渲染菜谱列表
function renderRecipes() {
    const recipesToShow = currentState.filteredRecipes;
    
    if (recipesToShow.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.recipeGrid.innerHTML = '';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.recipeGrid.innerHTML = recipesToShow.map(recipe => createRecipeCard(recipe)).join('');
    
    // 添加卡片点击事件
    document.querySelectorAll('.recipe-card').forEach((card, index) => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-small')) {
                const recipe = recipesToShow[index];
                openDetailModal(recipe);
            }
        });
    });
    
    // 添加编辑和删除按钮事件
    document.querySelectorAll('.btn-edit').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recipe = recipesToShow[index];
            openEditModal(recipe);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const recipe = recipesToShow[index];
            deleteRecipe(recipe.id);
        });
    });
}

// 创建菜谱卡片HTML
function createRecipeCard(recipe) {
    const imageHtml = recipe.image 
        ? `<img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">`
        : `<div class="recipe-image">🍳</div>`;
    
    return `
        <div class="recipe-card">
            ${imageHtml}
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.name}</h3>
                <div class="recipe-meta">
                    <span>⏱️ ${recipe.cookingTime}分钟</span>
                    ${recipe.calories ? `<span>🔥 ${recipe.calories}千卡</span>` : ''}
                </div>
                <div class="recipe-actions">
                    <button class="btn-small btn-edit">编辑</button>
                    <button class="btn-small btn-delete">删除</button>
                </div>
            </div>
        </div>
    `;
}

// 搜索处理
function handleSearch(e) {
    currentState.searchQuery = e.target.value.toLowerCase();
    applyFilters();
}

// 排序处理
function handleSort(e) {
    currentState.sortBy = e.target.value;
    applyFilters();
}

// 应用搜索和排序过滤
function applyFilters() {
    let filtered = [...currentState.recipes];
    
    // 搜索过滤
    if (currentState.searchQuery) {
        filtered = filtered.filter(recipe => 
            recipe.name.toLowerCase().includes(currentState.searchQuery)
        );
    }
    
    // 排序
    const [sortField, sortOrder] = currentState.sortBy.split('-');
    filtered.sort((a, b) => {
        let valueA = a[sortField];
        let valueB = b[sortField];
        
        if (sortField === 'name') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
            return valueA > valueB ? 1 : -1;
        } else {
            return valueA < valueB ? 1 : -1;
        }
    });
    
    currentState.filteredRecipes = filtered;
    renderRecipes();
}

// 打开添加菜谱模态框
function openAddModal() {
    currentState.isEditing = false;
    currentState.editingRecipe = null;
    elements.modalTitle.textContent = '添加新菜谱';
    elements.recipeForm.reset();
    clearImagePreview();
    clearIngredientsList();
    addIngredient(); // 添加一个空的用料输入行
    elements.recipeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 打开编辑菜谱模态框
function openEditModal(recipe) {
    currentState.isEditing = true;
    currentState.editingRecipe = recipe;
    elements.modalTitle.textContent = '编辑菜谱';
    
    // 填充表单数据
    document.getElementById('recipeName').value = recipe.name;
    document.getElementById('cookingTime').value = recipe.cookingTime;
    document.getElementById('calories').value = recipe.calories || '';
    document.getElementById('instructions').value = recipe.instructions;
    
    // 设置图片预览
    if (recipe.image) {
        setImagePreview(recipe.image);
    } else {
        clearImagePreview();
    }
    
    // 填充用料清单
    clearIngredientsList();
    recipe.ingredients.forEach(ingredient => {
        addIngredient(ingredient.name, ingredient.amount);
    });
    
    elements.recipeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal() {
    elements.recipeModal.style.display = 'none';
    document.body.style.overflow = '';
}

function closeDetailModal() {
    elements.detailModal.style.display = 'none';
    document.body.style.overflow = '';
}

// 处理图片上传
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('图片大小不能超过10MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 设置图片预览
function setImagePreview(src) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<img src="${src}" alt="预览图片">`;
}

// 清除图片预览
function clearImagePreview() {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `
        <div class="upload-placeholder">
            <span class="upload-icon">📷</span>
            <p>点击或拖拽上传图片</p>
        </div>
    `;
}

// 用料清单管理
function setupIngredientHandlers() {
    window.addIngredient = function(name = '', amount = '') {
        const container = document.getElementById('ingredientsList');
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            <input type="text" placeholder="食材名称" class="ingredient-name" value="${name}" required>
            <input type="text" placeholder="用量" class="ingredient-amount" value="${amount}" required>
            <button type="button" class="remove-ingredient" onclick="removeIngredient(this)">×</button>
        `;
        container.appendChild(div);
    };
    
    window.removeIngredient = function(button) {
        const container = document.getElementById('ingredientsList');
        if (container.children.length > 1) {
            button.parentElement.remove();
        } else {
            showToast('至少需要一种用料', 'warning');
        }
    };
}

// 清除用料清单
function clearIngredientsList() {
    const container = document.getElementById('ingredientsList');
    container.innerHTML = '';
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const recipe = {
        name: formData.get('name').trim(),
        cookingTime: parseInt(formData.get('cookingTime')),
        calories: formData.get('calories') ? parseInt(formData.get('calories')) : null,
        instructions: formData.get('instructions').trim(),
        ingredients: getIngredientsData(),
        image: getImageData()
    };
    
    // 验证数据
    if (!validateRecipe(recipe)) {
        return;
    }
    
    showLoading(true);
    
    try {
        if (currentState.isEditing) {
            // 编辑模式
            const updatedRecipe = {
                ...currentState.editingRecipe,
                ...recipe,
                updatedAt: new Date().toISOString()
            };
            store.updateRecipe(updatedRecipe);
            showToast('菜谱更新成功！');
        } else {
            // 添加模式
            const newRecipe = {
                ...recipe,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            store.addRecipe(newRecipe);
            showToast('菜谱添加成功！');
        }
        
        loadRecipes();
        closeModal();
    } catch (error) {
        console.error('保存菜谱失败:', error);
        showToast('保存失败，请重试', 'error');
    } finally {
        showLoading(false);
    }
}

// 获取用料数据
function getIngredientsData() {
    const items = document.querySelectorAll('.ingredient-item');
    return Array.from(items).map(item => ({
        name: item.querySelector('.ingredient-name').value.trim(),
        amount: item.querySelector('.ingredient-amount').value.trim()
    })).filter(ingredient => ingredient.name && ingredient.amount);
}

// 获取图片数据
function getImageData() {
    const previewImg = document.querySelector('#imagePreview img');
    return previewImg ? previewImg.src : null;
}

// 验证菜谱数据
function validateRecipe(recipe) {
    if (!recipe.name) {
        showToast('请输入菜名', 'error');
        return false;
    }
    
    if (!recipe.cookingTime || recipe.cookingTime <= 0) {
        showToast('请输入有效的烹饪时长', 'error');
        return false;
    }
    
    if (!recipe.instructions) {
        showToast('请输入详细做法', 'error');
        return false;
    }
    
    if (recipe.ingredients.length === 0) {
        showToast('请至少添加一种用料', 'error');
        return false;
    }
    
    return true;
}

// 打开详情模态框
function openDetailModal(recipe) {
    currentState.selectedRecipe = recipe;
    elements.detailTitle.textContent = recipe.name;
    
    const imageHtml = recipe.image 
        ? `<img src="${recipe.image}" alt="${recipe.name}" class="detail-image">`
        : '';
    
    const ingredientsHtml = recipe.ingredients.map(ing => 
        `<li><span>${ing.name}</span><span>${ing.amount}</span></li>`
    ).join('');
    
    elements.detailContent.innerHTML = `
        ${imageHtml}
        
        <div class="detail-section">
            <h3>基本信息</h3>
            <p><strong>烹饪时长：</strong>${recipe.cookingTime}分钟</p>
            ${recipe.calories ? `<p><strong>卡路里：</strong>${recipe.calories}千卡</p>` : ''}
            <p><strong>创建时间：</strong>${formatDate(recipe.createdAt)}</p>
        </div>
        
        <div class="detail-section">
            <h3>用料清单</h3>
            <div class="ingredients-detail">
                <ul>${ingredientsHtml}</ul>
            </div>
        </div>
        
        <div class="detail-section">
            <h3>详细做法</h3>
            <div class="instructions-detail">${recipe.instructions}</div>
        </div>
        
        <div class="detail-actions">
            <button class="btn btn-primary" onclick="openEditModalFromDetail()">编辑</button>
            <button class="btn btn-secondary" onclick="deleteRecipeFromDetail()">删除</button>
            <button class="btn btn-secondary" onclick="closeDetailModal()">关闭</button>
        </div>
    `;
    
    elements.detailModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 从详情页编辑
function openEditModalFromDetail() {
    closeDetailModal();
    openEditModal(currentState.selectedRecipe);
}

// 从详情页删除
function deleteRecipeFromDetail() {
    if (confirm('确定要删除这个菜谱吗？')) {
        deleteRecipe(currentState.selectedRecipe.id);
        closeDetailModal();
    }
}

// 删除菜谱
function deleteRecipe(recipeId) {
    if (confirm('确定要删除这个菜谱吗？')) {
        try {
            store.deleteRecipe(recipeId);
            loadRecipes();
            showToast('菜谱删除成功！');
        } catch (error) {
            console.error('删除菜谱失败:', error);
            showToast('删除失败，请重试', 'error');
        }
    }
}

// 导出数据
function exportData() {
    try {
        const data = store.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `虾蛋菜谱_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('数据导出成功！');
    } catch (error) {
        console.error('导出数据失败:', error);
        showToast('导出失败，请重试', 'error');
    }
}

// 导入数据
function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        showToast('请选择JSON格式的文件', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                store.importData(data);
                loadRecipes();
                showToast('数据导入成功！');
            } else {
                showToast('文件格式不正确', 'error');
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            showToast('导入失败，请检查文件格式', 'error');
        }
    };
    reader.readAsText(file);
    
    // 清空文件输入，允许重复选择同一文件
    e.target.value = '';
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 显示/隐藏加载状态
function showLoading(show) {
    elements.loading.style.display = show ? 'flex' : 'none';
}

// 格式化日期
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('zh-CN');
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 防抖函数
function debounce(func, wait) {
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

// 应用防抖到搜索
const debouncedSearch = debounce(handleSearch, 300);
elements.searchInput.addEventListener('input', debouncedSearch);

// 初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 防止页面刷新时丢失数据
window.addEventListener('beforeunload', () => {
    // 确保数据已保存
    store.saveToStorage();
});