// Move all DOM-dependent code inside DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // Get references to DOM elements
  const categoryFilter = document.getElementById("categoryFilter");
  const productsContainer = document.getElementById("productsContainer");
  const selectedProductsList = document.getElementById("selectedProductsList");
  const chatForm = document.getElementById("chatForm");
  const chatWindow = document.getElementById("chatWindow");
  const productSearch = document.getElementById("productSearch");
  const generateRoutineBtn = document.getElementById("generateRoutine");
  const toggleDirectionBtn = document.getElementById("toggleDirectionBtn");

  // Store selected products in an array, loaded from localStorage if available
  let selectedProducts = [];
  const SELECTED_PRODUCTS_KEY = "selectedProducts";

  // Load selected products from localStorage
  function loadSelectedProductsFromStorage() {
    const saved = localStorage.getItem(SELECTED_PRODUCTS_KEY);
    if (saved) {
      try {
        selectedProducts = JSON.parse(saved);
      } catch (e) {
        selectedProducts = [];
      }
    }
  }

  // Save selected products to localStorage
  function saveSelectedProductsToStorage() {
    localStorage.setItem(
      SELECTED_PRODUCTS_KEY,
      JSON.stringify(selectedProducts)
    );
  }

  /* Show initial placeholder until user selects a category */
  productsContainer.innerHTML = `
    <div class="placeholder-message">
      Select a category to view products
    </div>
  `;

  /* Load product data from JSON file */
  async function loadProducts() {
    const response = await fetch("products.json");
    const data = await response.json();
    return data.products;
  }

  // Store the last loaded products for filtering
  let allProducts = [];

  // Helper function to filter products by category and search keyword
  function getFilteredProducts() {
    const selectedCategory = categoryFilter.value;
    const searchValue = productSearch.value.trim().toLowerCase();
    return allProducts.filter((product) => {
      // Filter by category if selected
      const matchesCategory =
        selectedCategory !== "all" && selectedCategory !== ""
          ? product.category === selectedCategory
          : true;
      // Filter by search keyword in name, brand, or description
      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        (product.brand && product.brand.toLowerCase().includes(searchValue)) ||
        (product.description &&
          product.description.toLowerCase().includes(searchValue));
      return matchesCategory && matchesSearch;
    });
  }

  // Display product cards and enable selection and description toggle
  function displayProducts(products) {
    // Show a message if there are no products to display
    if (!products || products.length === 0) {
      productsContainer.innerHTML = `
        <div class="placeholder-message">
          No products found.
        </div>
      `;
      return;
    }

    // Render product cards
    productsContainer.innerHTML = products
      .map((product) => {
        const isSelected = selectedProducts.some(
          (p) => p.name === product.name
        );
        return `
          <div class="product-card${
            isSelected ? " selected" : ""
          }" data-product-name="${product.name}">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
              <h3>${product.name}</h3>
              <p>${product.brand}</p>
              <button class="desc-toggle" aria-expanded="false" aria-controls="desc-${product.name.replace(
                /\s+/g,
                "-"
              )}">Details</button>
              <div class="product-desc" id="desc-${product.name.replace(
                /\s+/g,
                "-"
              )}">
                <p>${product.description || "No description available."}</p>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    // Add click event listeners to product cards (for selection)
    // Use allProducts to find the product object for selection
    const cards = productsContainer.querySelectorAll(".product-card");
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        // Prevent selection if clicking on the description toggle or inside the description
        if (
          e.target.classList.contains("desc-toggle") ||
          e.target.closest(".product-desc")
        ) {
          return;
        }
        const name = card.getAttribute("data-product-name");
        // Always find the product from allProducts to ensure correct reference
        const product = allProducts.find((p) => p.name === name);
        if (!product) return;
        const index = selectedProducts.findIndex((p) => p.name === name);
        if (index === -1) {
          selectedProducts.push(product);
        } else {
          selectedProducts.splice(index, 1);
        }
        saveSelectedProductsToStorage();
        displayProducts(getFilteredProducts()); // Refresh grid to update selection
        updateSelectedProducts();
      });
    });

    // Add event listeners to description toggle buttons
    const toggles = productsContainer.querySelectorAll(".desc-toggle");
    toggles.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const descId = btn.getAttribute("aria-controls");
        const desc = document.getElementById(descId);
        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", !expanded);
        desc.classList.toggle("open", !expanded);
      });
    });
  }

  // Update the Selected Products section
  function updateSelectedProducts() {
    if (selectedProducts.length === 0) {
      selectedProductsList.innerHTML =
        '<div class="placeholder-message">No products selected</div>';
      // Remove clear button if present
      const clearBtn = document.getElementById("clearSelectedBtn");
      if (clearBtn) clearBtn.remove();
      return;
    }
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (product, idx) => `
          <div class="selected-product-item">
            <img src="${product.image}" alt="${product.name}">
            <span>${product.name}</span>
            <button class="remove-selected" data-index="${idx}" title="Remove">
              <i class="fa fa-times"></i>
            </button>
          </div>
        `
      )
      .join("");

    // Add clear all button if not present
    if (!document.getElementById("clearSelectedBtn")) {
      const clearBtn = document.createElement("button");
      clearBtn.id = "clearSelectedBtn";
      clearBtn.className = "remove-selected";
      clearBtn.innerHTML = '<i class="fa fa-trash"></i> Clear All';
      clearBtn.style.marginLeft = "10px";
      clearBtn.style.fontSize = "15px";
      clearBtn.style.padding = "6px 14px";
      clearBtn.style.borderRadius = "8px";
      clearBtn.style.background = "#fffbe7";
      clearBtn.style.border = "1.5px solid #e3a535";
      clearBtn.style.color = "#ff003b";
      clearBtn.style.cursor = "pointer";
      clearBtn.style.fontWeight = "500";
      clearBtn.style.marginTop = "10px";
      clearBtn.addEventListener("click", () => {
        selectedProducts = [];
        saveSelectedProductsToStorage();
        updateSelectedProducts();
        // If a category is selected, reload those products
        const selectedCategory = categoryFilter.value;
        if (selectedCategory) {
          loadProducts().then((products) => {
            const filtered = products.filter(
              (p) => p.category === selectedCategory
            );
            displayProducts(filtered);
          });
        }
      });
      selectedProductsList.parentNode.appendChild(clearBtn);
    }

    // Add event listeners to remove buttons
    const removeBtns =
      selectedProductsList.querySelectorAll(".remove-selected");
    removeBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index"));
        selectedProducts.splice(idx, 1);
        saveSelectedProductsToStorage();
        // Re-render both grid and selected list
        // If a category is selected, reload those products
        const selectedCategory = categoryFilter.value;
        if (selectedCategory) {
          loadProducts().then((products) => {
            const filtered = products.filter(
              (p) => p.category === selectedCategory
            );
            displayProducts(filtered);
          });
        }
        updateSelectedProducts();
      });
    });
  }

  /* Filter and display products when category changes */

  // Remove this old event listener (if present):
  // categoryFilter.addEventListener("change", async (e) => {
  //   const products = await loadProducts();
  //   const selectedCategory = e.target.value;
  //   const filteredProducts = products.filter(
  //     (product) => product.category === selectedCategory
  //   );
  //   displayProducts(filteredProducts);
  // });

  categoryFilter.addEventListener("change", () => {
    displayProducts(getFilteredProducts());
  });

  // Listen for input in the search field
  productSearch.addEventListener("input", () => {
    displayProducts(getFilteredProducts());
  });

  // Store chat history as an array of messages
  let chatMessages = [];

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userInput = document.getElementById("userInput").value.trim();
    if (!userInput) return;

    // Add user message to chat history
    chatMessages.push({ role: "user", content: userInput });

    // Show user message in chat window
    chatWindow.innerHTML += `<div class="chat-message user">${userInput}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Show loading indicator
    chatWindow.innerHTML += `<div class="chat-message bot" id="loadingMsg">Thinking...</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // For follow-up, always use the current chatMessages array (which includes the routine if generated)
    // Add a system message to keep the bot focused on beauty topics and the routine
    const systemMsg =
      "You are a helpful beauty advisor. Only answer questions about the generated routine, skincare, haircare, makeup, fragrance, or related beauty topics.";
    const messagesToSend = [
      { role: "system", content: systemMsg },
      ...chatMessages,
    ];

    try {
      const reply = await fetchOpenAIResponse(messagesToSend);
      // Remove loading indicator
      const loadingMsg = document.getElementById("loadingMsg");
      if (loadingMsg) loadingMsg.remove();
      // Add assistant reply to chat window and history
      chatMessages.push({ role: "assistant", content: reply });
      chatWindow.innerHTML += `<div class="chat-message bot">${reply}</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (err) {
      const loadingMsg = document.getElementById("loadingMsg");
      if (loadingMsg) loadingMsg.remove();
      chatWindow.innerHTML += `<div class="chat-message bot">Sorry, there was a problem connecting to the assistant.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // Clear input
    document.getElementById("userInput").value = "";
  });

  // Make sure to always use the latest selectedProducts when generating a routine
  generateRoutineBtn.addEventListener("click", async () => {
    // If no products are selected, show a message and stop
    if (!selectedProducts || selectedProducts.length === 0) {
      chatWindow.innerHTML += `<div class="chat-message bot">Please select at least one product to generate a routine.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      return;
    }

    // Show loading indicator in the chat window
    chatWindow.innerHTML += `<div class="chat-message bot" id="loadingMsg">Generating your personalized routine...</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Prepare the system message and user message for OpenAI
    const systemMsg =
      "You are a helpful beauty advisor. Based on the following selected products, generate a step-by-step personalized beauty routine. Use clear steps and explain why each product is used.";
    const userMsg = `Selected products (as JSON):\n${JSON.stringify(
      selectedProducts.map((p) => ({
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description,
      })),
      null,
      2
    )}`;

    // Start a new conversation context for the routine
    chatMessages = [
      { role: "system", content: systemMsg },
      { role: "user", content: userMsg },
    ];

    try {
      // Call OpenAI API and get the reply
      const reply = await fetchOpenAIResponse(chatMessages);
      // Remove loading indicator
      const loadingMsg = document.getElementById("loadingMsg");
      if (loadingMsg) loadingMsg.remove();
      // Show the routine in the chat window
      chatWindow.innerHTML += `<div class="chat-message bot">${reply}</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      // Add the routine to the chat history for follow-up questions
      chatMessages.push({ role: "assistant", content: reply });
    } catch (err) {
      const loadingMsg = document.getElementById("loadingMsg");
      if (loadingMsg) loadingMsg.remove();
      chatWindow.innerHTML += `<div class="chat-message bot">Sorry, there was a problem generating your routine.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  });

  // Helper function to call OpenAI API via Cloudflare Worker with web search enabled
  async function fetchOpenAIResponse(messages) {
    // We use the gpt-4o model with web search tool enabled for real-time info
    // This allows the assistant to provide up-to-date L'Oréal product info and links
    const response = await fetch("/cloudworker", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        tools: [{ type: "web_search" }],
        messages,
      }),
    });
    const data = await response.json();
    // Check for citations or links in the response and display them if present
    let reply = "";
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      reply = data.choices[0].message.content;
      // If there are tool_calls (citations/links), append them
      if (
        data.choices[0].message.tool_calls &&
        Array.isArray(data.choices[0].message.tool_calls)
      ) {
        const links = data.choices[0].message.tool_calls
          .map((tool) => {
            if (tool.type === "web_search" && tool.result && tool.result.url) {
              return `<a href="${tool.result.url}" target="_blank" rel="noopener">[Source]</a>`;
            }
            return "";
          })
          .filter(Boolean)
          .join(" ");
        if (links) {
          reply += `<br><br>${links}`;
        }
      }
    } else {
      reply = "Sorry, I couldn't get a response from the assistant.";
    }
    return reply;
  }

  // Make sure to load all products and display the initial grid
  async function initializeProductFilters() {
    // Load all products from the JSON file
    allProducts = await loadProducts();
    // Display products based on current filters (category and search)
    displayProducts(getFilteredProducts());
  }

  // On page load, load selected products and products grid
  loadSelectedProductsFromStorage();
  updateSelectedProducts();
  initializeProductFilters();

  // Set direction based on browser language (auto RTL for Arabic, Hebrew, Persian, Urdu, etc.)
  const rtlLangs = ["ar", "he", "fa", "ur"];
  const userLang = navigator.language || navigator.userLanguage || "en";
  const html = document.documentElement;
  if (rtlLangs.some((l) => userLang.startsWith(l))) {
    html.setAttribute("dir", "rtl");
  } else {
    html.setAttribute("dir", "ltr");
  }
});

// Remove any code outside DOMContentLoaded that references DOM elements
