import { useState, useEffect, useRef, useCallback } from 'react';
import { UtensilsCrossed, Upload, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { menuService } from '../../services/menu.service';
import type { Category, MenuItem, CategoryRequest, MenuItemRequest } from '../../types/menu.types';

type Tab = 'categories' | 'items';

export default function MenuManagementPage() {
  const [tab, setTab] = useState<Tab>('items');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState<CategoryRequest>({ name: '', description: '', imageUrl: '', sortOrder: 0 });
  const [catSaving, setCatSaving] = useState(false);

  // Item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<MenuItemRequest>({
    name: '', description: '', price: 0, imageUrl: '', categoryId: 0,
    isAvailable: true, isVegetarian: false, isVegan: false, isSpicy: false,
    sortOrder: 0, allergens: '',
  });
  const [itemSaving, setItemSaving] = useState(false);
  const [itemFormError, setItemFormError] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    // Show local preview immediately while upload is in progress
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to backend and store the returned URL
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8081/api/v1/menu/items/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Cookies.get('accessToken') ?? ''}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const { imageUrl } = await res.json();
      setItemForm(f => ({ ...f, imageUrl }));
    } catch (err: any) {
      setItemFormError('Image upload failed. Please try again.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const clearImage = () => {
    setImagePreview('');
    setItemForm(f => ({ ...f, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, menuItems] = await Promise.all([
        menuService.getCategories(),
        menuService.getFullMenu(),
      ]);
      setCategories(cats);
      setItems(menuItems);
    } catch {
      setError('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // When categories load (or change), keep the item form's categoryId pointing at
  // a real category — fixes the blank dropdown when categories arrive after mount.
  useEffect(() => {
    if (categories.length > 0) {
      setItemForm(f => ({
        ...f,
        categoryId: f.categoryId === 0 ? categories[0].id : f.categoryId,
      }));
    }
  }, [categories]);

  // Category actions

  const openNewCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '', imageUrl: '', sortOrder: 0 });
    setShowCatForm(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || '', sortOrder: cat.sortOrder });
    setShowCatForm(true);
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) return;
    setCatSaving(true);
    try {
      if (editingCat) {
        const updated = await menuService.updateCategory(editingCat.id, catForm);
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await menuService.createCategory(catForm);
        setCategories(prev => [...prev, created]);
      }
      setShowCatForm(false);
    } catch {
      setError('Failed to save category');
    } finally {
      setCatSaving(false);
    }
  };

  const deleteCat = async (id: number) => {
    if (!confirm('Delete this category? Items in it will be hidden.')) return;
    try {
      await menuService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Failed to delete category');
    }
  };

  // Item actions

  const openNewItem = () => {
    setEditingItem(null);
    setItemFormError('');
    setImagePreview('');
    setItemForm({
      name: '', description: '', price: 0, imageUrl: '',
      categoryId: categories[0]?.id ?? 0,
      isAvailable: true, isVegetarian: false, isVegan: false, isSpicy: false,
      sortOrder: 0, allergens: '',
    });
    setShowItemForm(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormError('');
    setImagePreview(item.imageUrl || '');
    setItemForm({
      name: item.name, description: item.description || '', price: item.price,
      imageUrl: item.imageUrl || '', categoryId: item.categoryId,
      isAvailable: item.isAvailable, isVegetarian: item.isVegetarian,
      isVegan: item.isVegan, isSpicy: item.isSpicy, sortOrder: item.sortOrder,
      allergens: item.allergens || '',
    });
    setShowItemForm(true);
  };

  const saveItem = async () => {
    // Inline validation
    if (!itemForm.name.trim()) {
      setItemFormError('Item name is required.');
      return;
    }
    if (!itemForm.categoryId || itemForm.categoryId === 0) {
      setItemFormError('Please select a category.');
      return;
    }
    if (!itemForm.price || itemForm.price < 0.01) {
      setItemFormError('Price must be at least NPR0.01.');
      return;
    }

    setItemFormError('');
    setItemSaving(true);
    try {
      if (editingItem) {
        const updated = await menuService.updateMenuItem(editingItem.id, itemForm);
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await menuService.createMenuItem(itemForm);
        setItems(prev => [...prev, created]);
      }
      setShowItemForm(false);
      setImagePreview('');
    } catch (err: any) {
      setItemFormError(err?.response?.data?.message || 'Failed to save menu item. Please try again.');
    } finally {
      setItemSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Remove this item from the menu?')) return;
    try {
      await menuService.deleteMenuItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      setError('Failed to delete item');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await menuService.updateMenuItem(item.id, { ...item, categoryId: item.categoryId, isAvailable: !item.isAvailable });
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } catch {
      setError('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 animate-fade-up max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Menu Management</h1>
        <button
          onClick={tab === 'categories' ? openNewCat : openNewItem}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition"
        >
          + Add {tab === 'categories' ? 'Category' : 'Item'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['items', 'categories'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 font-semibold capitalize transition border-b-2 -mb-px ${
              tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t} {t === 'items' ? `(${items.length})` : `(${categories.length})`}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">{cat.itemCount} items</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditCat(cat)} className="text-gray-400 hover:text-blue-500 p-1">✏️</button>
                  <button onClick={() => deleteCat(cat.id)} className="text-gray-400 hover:text-red-500 p-1">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items Tab */}
      {tab === 'items' && (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Item</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Category</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Price</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Tags</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                        : <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center"><UtensilsCrossed size={16} className="text-orange-300" /></div>
                      }
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-400 truncate max-w-48">{item.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.categoryName}</td>
                  <td className="px-4 py-3 font-semibold text-orange-600">NPR{item.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {item.isVegetarian && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Veg</span>}
                      {item.isVegan && <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Vegan</span>}
                      {item.isSpicy && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Spicy</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEditItem(item)} className="text-gray-400 hover:text-blue-500 p-1">✏️</button>
                      <button onClick={() => deleteItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No menu items yet. Add your first item!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.55)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-enter">
            <h2 className="text-lg font-bold mb-4">{editingCat ? 'Edit Category' : 'New Category'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input value={catForm.imageUrl} onChange={e => setCatForm(f => ({ ...f, imageUrl: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={catForm.sortOrder} onChange={e => setCatForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCatForm(false)} className="flex-1 border rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={saveCat} disabled={catSaving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
                {catSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.55)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto modal-enter">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-4">{editingItem ? 'Edit Menu Item' : 'New Menu Item'}</h2>
            {itemFormError && (
              <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {itemFormError}
              </div>
            )}

            {categories.length === 0 && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                No categories yet. Go to the <strong>Categories</strong> tab and add one first.
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    value={itemForm.name}
                    onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Chicken Rice"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (NPR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={itemForm.price || ''}
                    onChange={e => setItemForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={itemForm.categoryId}
                    onChange={e => setItemForm(f => ({ ...f, categoryId: Number(e.target.value) }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    <option value={0} disabled>-- Select category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
              </div>
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Photo</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed cursor-pointer transition ${
                      dragOver ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'
                    }`}
                  >
                    <Upload size={22} className={dragOver ? 'text-orange-500' : 'text-gray-400'} />
                    <p className="text-sm text-gray-500">Drop an image here or <span className="text-orange-500 font-medium">click to browse</span></p>
                    <p className="text-xs text-gray-400">JPG, PNG, WEBP supported</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergens (comma-separated)</label>
                <input value={itemForm.allergens} onChange={e => setItemForm(f => ({ ...f, allergens: e.target.value }))}
                  placeholder="e.g. gluten, dairy, nuts"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'isAvailable', label: 'Available' },
                  { key: 'isVegetarian', label: 'Vegetarian' },
                  { key: 'isVegan', label: 'Vegan' },
                  { key: 'isSpicy', label: 'Spicy' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!itemForm[key as keyof MenuItemRequest]}
                      onChange={e => setItemForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowItemForm(false); setItemFormError(''); setImagePreview(''); }}
                className="flex-1 border rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveItem}
                disabled={itemSaving || categories.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {itemSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
