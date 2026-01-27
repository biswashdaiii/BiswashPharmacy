import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import ProductItem from '../components/ProductItem'
import { useSearchParams } from 'react-router-dom';

const Collection = () => {

    const { products, search, showSearch } = useContext(ShopContext);
    const [showFilter, setShowFilter] = useState(false);
    const [filterProducts, setFilterProducts] = useState([]);
    const [category, setCategory] = useState([]);
    const [subCategory, setSubCategory] = useState([]);
    const [sortType, setSortType] = useState('relevant');

    const toggleCategory = (e) => {
        if (category.includes(e.target.value)) {
            setCategory(prev => prev.filter(item => item !== e.target.value))
        }
        else {
            setCategory(prev => [...prev, e.target.value])
        }
    }

    const toggleSubCategory = (e) => {
        if (subCategory.includes(e.target.value)) {
            setSubCategory(prev => prev.filter(item => item !== e.target.value))
        }
        else {
            setSubCategory(prev => [...prev, e.target.value])
        }
    }

    const applyFilter = () => {
        let productsCopy = products.slice();

        if (showSearch && search) {
            productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
        }

        if (category.length > 0) {
            productsCopy = productsCopy.filter(item => category.includes(item.category));
        }

        if (subCategory.length > 0) {
            productsCopy = productsCopy.filter(item => subCategory.includes(item.subCategory));
        }

        setFilterProducts(productsCopy)
    }

    const sortProduct = () => {
        let fpCopy = filterProducts.slice();

        switch (sortType) {
            case 'low-high':
                setFilterProducts(fpCopy.sort((a, b) => (a.price - b.price)));
                break;

            case 'high-low':
                setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)));
                break;

            default:
                applyFilter();
                break;
        }
    }

    useEffect(() => {
        applyFilter();
    }, [category, subCategory, search, showSearch, products])

    useEffect(() => {
        sortProduct();
    }, [sortType])

    return (
        <div className='flex flex-col sm:flex-row gap-8 pt-8 border-t border-gray-100'>

            {/* Filter Options */}
            <div className='min-w-60'>
                <div
                    onClick={() => setShowFilter(!showFilter)}
                    className='flex items-center cursor-pointer gap-3 mb-6 group'
                >
                    <p className='text-lg font-semibold text-gray-800 tracking-tight'>Filter by</p>
                    <img className={`h-2.5 sm:hidden transition-transform duration-300 ${showFilter ? 'rotate-180' : ''}`} src={assets.dropdown_icon} alt="" />
                </div>

                <div className="flex flex-col gap-6">
                    {/* Category Filter */}
                    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${showFilter ? 'block' : 'hidden'} sm:block transition-all`}>
                        <p className='mb-4 text-[11px] font-semibold text-primary uppercase tracking-wider'>Categories</p>
                        <div className='flex flex-col gap-3 text-sm font-medium text-gray-500'>
                            {['Medicine', 'Personal Care', 'Supplements'].map((cat) => (
                                <label key={cat} className='flex items-center gap-3 cursor-pointer group/label hover:text-gray-900 transition-colors'>
                                    <input
                                        className='w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer'
                                        type="checkbox"
                                        value={cat}
                                        onChange={toggleCategory}
                                    />
                                    <span className="text-[13px]">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* SubCategory Filter */}
                    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${showFilter ? 'block' : 'hidden'} sm:block transition-all`}>
                        <p className='mb-4 text-[11px] font-semibold text-primary uppercase tracking-wider'>Product Type</p>
                        <div className='flex flex-col gap-3 text-sm font-medium text-gray-500'>
                            {['Tablet', 'Syrup', 'Topical'].map((sub) => (
                                <label key={sub} className='flex items-center gap-3 cursor-pointer group/label hover:text-gray-900 transition-colors'>
                                    <input
                                        className='w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer'
                                        type="checkbox"
                                        value={sub}
                                        onChange={toggleSubCategory}
                                    />
                                    <span className="text-[13px]">{sub}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Listing */}
            <div className='flex-1'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
                    <div className="flex flex-col gap-0.5">
                        <h2 className='text-3xl font-semibold text-gray-900 tracking-tight'>All Collections</h2>
                        <p className="text-gray-400 font-medium text-[11px]">
                            Showing {filterProducts.length} results
                        </p>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative group w-full md:w-auto">
                        <select
                            onChange={(e) => setSortType(e.target.value)}
                            className='w-full md:w-auto appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 text-[12px] font-medium text-gray-600 outline-none focus:border-primary transition-all cursor-pointer shadow-sm'
                        >
                            <option value="relevant">Sort by: Relevant</option>
                            <option value="low-high">Sort by: Price: Low to High</option>
                            <option value="high-low">Sort by: Price: High to Low</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {filterProducts.length > 0 ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10'>
                        {filterProducts.map((item, index) => (
                            <ProductItem key={item._id || index} name={item.name} id={item._id} price={item.price} image={item.image} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-3xl border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
                        <p className="text-gray-500 max-w-xs text-center font-medium text-[13px] px-6">Try adjusting your filters or search terms.</p>
                        <button
                            onClick={() => { setCategory([]); setSubCategory([]); }}
                            className="mt-6 text-primary font-semibold text-sm hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

        </div>
    )
}

export default Collection
