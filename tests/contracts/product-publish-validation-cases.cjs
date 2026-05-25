const product = {
  id: 'product-1',
  productCode: 'A1023',
  productName: 'Cotton Shirt',
  description: '',
  mainImageUrl: 'cloud://main.png',
  imageUrls: ['cloud://main.png'],
  status: 'ready_to_publish',
  createdFromBatchId: 'batch-1',
  createdAt: '2026-05-25T00:00:00.000Z',
  updatedAt: '2026-05-25T00:00:00.000Z',
}

const sku = {
  id: 'sku-1',
  productId: 'product-1',
  productCode: 'A1023',
  spec: 'Black/M',
  salePrice: 129,
  stock: 1,
}

const productPublishValidationCases = [
  {
    name: 'allows a product with a main image and one priced in-stock SKU',
    product,
    skus: [sku],
    expectedMessages: [],
  },
  {
    name: 'requires a main image and at least one SKU',
    product: { ...product, mainImageUrl: '', imageUrls: [] },
    skus: [],
    expectedMessages: ['缺少主图，无法上架', '没有可售规格，无法上架'],
  },
  {
    name: 'blocks publishing when every SKU is out of stock',
    product,
    skus: [{ ...sku, stock: 0 }],
    expectedMessages: ['全部规格暂无库存，请先补库存'],
  },
  {
    name: 'requires positive prices on in-stock saleable SKUs',
    product,
    skus: [{ ...sku, salePrice: 0, stock: 1 }],
    expectedMessages: ['存在价格为 0 的规格，请先补全售价'],
  },
  {
    name: 'requires spec names on in-stock saleable SKUs',
    product,
    skus: [{ ...sku, spec: '   ', stock: 1 }],
    expectedMessages: ['存在规格名为空的规格，请先补全规格名'],
  },
  {
    name: 'blocks duplicate specs after trimming whitespace',
    product,
    skus: [sku, { ...sku, id: 'sku-2', spec: ' Black/M ' }],
    expectedMessages: ['存在重复规格，请先合并或修改'],
  },
  {
    name: 'ignores sold-out SKU price and spec completion when another SKU is saleable',
    product,
    skus: [
      sku,
      { ...sku, id: 'sku-2', spec: '   ', salePrice: 0, stock: 0 },
    ],
    expectedMessages: [],
  },
]

module.exports = {
  productPublishValidationCases,
}
