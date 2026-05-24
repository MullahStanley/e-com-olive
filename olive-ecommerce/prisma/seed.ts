import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin123!', 12);

  const admin = await prisma.partner.upsert({
    where: { email: 'admin@shophub.local' },
    update: {},
    create: {
      email: 'admin@shophub.local',
      password: adminPassword,
      name: 'Shop Admin',
      role: 'admin',
      phone: '+10000000000',
    },
  });

  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Home', slug: 'home' },
    { name: 'Fashion', slug: 'fashion' },
  ];

  for (const cat of categories) {
    await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const sampleProducts = [
    {
      name: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Premium noise-cancelling wireless headphones with 30h battery life.',
      price: 4500,
      categoryName: 'Electronics',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      stockQty: 25,
      featured: true,
    },
    {
      name: 'Smart Watch',
      slug: 'smart-watch',
      description: 'Fitness tracking, heart rate monitor, and smartphone notifications.',
      price: 8900,
      categoryName: 'Electronics',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
      stockQty: 15,
      featured: true,
    },
    {
      name: 'Ceramic Coffee Mug',
      slug: 'ceramic-coffee-mug',
      description: 'Handcrafted 350ml ceramic mug, dishwasher safe.',
      price: 1200,
      categoryName: 'Home',
      images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800'],
      stockQty: 50,
      featured: false,
    },
  ];

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log(`Seed complete. Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
