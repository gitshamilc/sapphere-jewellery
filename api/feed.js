module.exports = async (req, res) => {
  try {
    // Fetch products from Supabase REST API
    const response = await fetch('https://gimnnaeinzdogujeiwqv.supabase.co/rest/v1/jewelry_products?select=*', {
      headers: {
        'apikey': 'sb_publishable_TtWIL2XJux_1m5XoDWKhmA_yefBPgqO',
        'Authorization': 'Bearer sb_publishable_TtWIL2XJux_1m5XoDWKhmA_yefBPgqO'
      }
    });
    
    let products = [];
    if (response.ok) {
      products = await response.json();
    }
    
    // Fallback if db query fails or returns empty list
    if (!products || products.length === 0) {
      products = getDefaultProducts();
    }
    
    const xml = generateXML(products);
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Feed generation error:', error);
    const xml = generateXML(getDefaultProducts());
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  }
};

function generateXML(products) {
  let itemsXml = '';
  products.forEach(p => {
    if (!p) return;
    
    const id = p.id;
    const name = escapeXml(p.name || 'SAPPHERE Jewelry');
    const description = escapeXml(p.description || `${p.name} - premium exquisite handcrafted jewelry.`);
    const price = p.price ? `${p.price} INR` : '0 INR';
    
    let imgUrl = p.img || '';
    if (typeof imgUrl === 'string') {
      if (imgUrl.startsWith('../')) imgUrl = imgUrl.substring(3);
      if (!imgUrl.startsWith('http')) {
        imgUrl = `https://sapphere.xyz/${imgUrl}`;
      }
    }
    imgUrl = escapeXml(imgUrl);
    
    let googleCategory = 'Apparel &amp; Accessories &gt; Jewelry &gt; Necklaces';
    const cat = (p.cat || '').toLowerCase();
    if (cat.includes('earring') || cat.includes('stud')) {
      googleCategory = 'Apparel &amp; Accessories &gt; Jewelry &gt; Earrings';
    } else if (cat.includes('ring') || cat.includes('solitaire')) {
      googleCategory = 'Apparel &amp; Accessories &gt; Jewelry &gt; Rings';
    } else if (cat.includes('bracelet') || cat.includes('bangle')) {
      googleCategory = 'Apparel &amp; Accessories &gt; Jewelry &gt; Bracelets';
    }
    
    itemsXml += `
    <item>
      <g:id>${id}</g:id>
      <g:title>${name}</g:title>
      <g:description>${description}</g:description>
      <g:link>https://sapphere.xyz/product/${id}</g:link>
      <g:image_link>${imgUrl}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${price}</g:price>
      <g:brand>SAPPHERE</g:brand>
      <g:google_product_category>${googleCategory}</g:google_product_category>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SAPPHERE Premium Jewelry</title>
    <link>https://sapphere.xyz</link>
    <description>Premium, intimate e-commerce jewelry store showcasing hand-crafted royal sapphire, gold, and bead necklaces, earrings, and pendants.</description>
    ${itemsXml}
  </channel>
</rss>`;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function getDefaultProducts() {
  return [
    {
      id: "flora-bead",
      name: "Flora Bead Choker",
      price: 1899,
      img: "photosjewewllry/jewelry-01.jpg",
      cat: "necklace",
      description: "A playful, graceful gold chain adorned with hand-strung multi-colored floral bead charms."
    },
    {
      id: "earring-suite",
      name: "Atelier Earring Suite",
      price: 2499,
      img: "photosjewewllry/jewelry-10.jpg",
      cat: "earrings",
      description: "Curated suite of three distinct gold earrings: floral studs, double heart hoops, and bamboo hoops."
    },
    {
      id: "aura-heart",
      name: "Aura Heart Pendant",
      price: 1599,
      img: "photosjewewllry/jewelry-05.jpg",
      cat: "necklace",
      description: "A classic minimal gold chain holding a polished solid gold heart pendant on a premium display stand."
    },
    {
      id: "silken-heart",
      name: "Silken Heart Choker",
      price: 1699,
      img: "photosjewewllry/jewelry-07.jpg",
      cat: "necklace",
      description: "A delicate hollow gold heart pendant layered elegantly over natural liquid-silk champagne drapery."
    },
    {
      id: "layered-necklace",
      name: "Royal Layered Necklace",
      price: 1899,
      img: "photosjewewllry/jewelry-01.jpg",
      cat: "necklace",
      description: "Intricately styled layered necklace blending warm yellow gold bars and custom sweep links."
    },
    {
      id: "gold-choker",
      name: "Gold Bead Choker",
      price: 1499,
      img: "photosjewewllry/jewelry-02.jpg",
      cat: "necklace",
      description: "Minimalist elegant gold bead choker, perfect for stacking and everyday elegance."
    },
    {
      id: "pearl-strand",
      name: "Intimate Pearl Strand",
      price: 2199,
      img: "photosjewewllry/jewelry-03.jpg",
      cat: "necklace",
      description: "Elegant genuine pearl strand displaying subtle cream iridescent tones and safe gold locks."
    },
    {
      id: "floral-studs",
      name: "Floral Stud Earrings",
      price: 1399,
      img: "photosjewewllry/jewelry-06.jpg",
      cat: "earrings",
      description: "Dainty floral stud earrings designed to frame the face with light-catching golden petals."
    },
    {
      id: "gold-bracelet",
      name: "Velvet Gold Bracelet",
      price: 1599,
      img: "photosjewewllry/jewelry-09.jpg",
      cat: "bracelet",
      description: "Sleek and polished gold bracelet designed with smooth link loops and custom security sweeps."
    },
    {
      id: "gold-ring",
      name: "Rose Gold Statement Ring",
      price: 1199,
      img: "photosjewewllry/jewelry-13.jpg",
      cat: "ring",
      description: "Bold rose gold band ring, hand-polished to capture modern architectural sophistication."
    },
    {
      id: "crystal-drops",
      name: "Crystal Drop Earrings",
      price: 1699,
      img: "photosjewewllry/jewelry-11.jpg",
      cat: "earrings",
      description: "Dazzling crystal drop earrings that cascade gracefully to add royalty and glamour."
    },
    {
      id: "combo-set",
      name: "Bridal Combo Set",
      price: 3899,
      img: "photosjewewllry/jewelry-12.jpg",
      cat: "set",
      description: "A rich jewelry suite containing matching royal layered choker and drop studs."
    },
    {
      id: "tennis-bracelet",
      name: "Diamond Tennis Bracelet",
      price: 1999,
      img: "photosjewewllry/jewelry-16.jpg",
      cat: "bracelet",
      description: "Classic high-end tennis bracelet hand-set with highly brilliant sparkling faceted simulated diamonds."
    },
    {
      id: "festive-set",
      name: "Festive Gold Set",
      price: 3599,
      img: "photosjewewllry/jewelry-14.jpg",
      cat: "set",
      description: "Elegant traditional gold-sweep matching choker and bangle set designed for celebrations."
    },
    {
      id: "luxury-set",
      name: "Sapphire Luxury Set",
      price: 4499,
      img: "photosjewewllry/jewelry-15.jpg",
      cat: "set",
      description: "Our crown jewel masterpiece suite, featuring royal blue sapphires in intricate golden settings."
    },
    {
      id: "emerald-ring",
      name: "Emerald Solitaire Ring",
      price: 1899,
      img: "photosjewewllry/jewelry-17.jpg",
      cat: "ring",
      description: "A breathtaking solitaire ring showcasing a deep forest green faceted emerald cut gem."
    }
  ];
}
