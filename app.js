new Vue({
  el: '#app', // Binds this Vue instance to the DOM element with id="app"
  data: {
    lessons: [], // Stores the list of lessons fetched from the server
    orders: [], // Array to store orders
    sortBy: 'subject', // Initialize default sorting by subject
    sortOrder: 'asc', // Initialize default sort order (ascending)
    searchQuery: '', // Search query entered by the user
    cart: [], // Array to store lessons added to the cart
    showCart: false, // Controls visibility of the cart
    name: '', // User's name for checkout
    phone: '', // User's phone number for checkout
    nameError: '', // Error message for invalid name input
    phoneError: '', // Error message for invalid phone input
    confirmationMessage: '', // Message displayed after successfully submitting an order
    showModal: false, // Controls visibility of the modal for checkout
    groupedCart: {}, // Grouped cart object for displaying grouped lessons
  },

  computed: {
    // Filter and sort lessons based on search query and sorting preferences
    sortedLessons() {
      let filteredLessons = this.lessons.filter((lesson) => {
        return (
          (lesson.subject && lesson.subject.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
          (lesson.location && lesson.location.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );
      });

      return filteredLessons.sort((a, b) => {
        let modifier = this.sortOrder === 'asc' ? 1 : -1;
        if (this.sortBy === 'price' || this.sortBy === 'spaces') {
          return (a[this.sortBy] - b[this.sortBy]) * modifier;
        } else {
          let aValue = a[this.sortBy] || '';
          let bValue = b[this.sortBy] || '';
          return aValue.localeCompare(bValue) * modifier;
        }
      });
    },
    // Check if the checkout form is valid
    isFormValid() {
      return this.name && !this.nameError && this.phone && !this.phoneError;
    },
  },

  methods: {
    // Fetch lessons from the server
    async fetchProducts() {
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons');
        this.lessons = await response.json();
      } catch (error) {
        console.error('Error fetching lessons:', error);
      }
    },

    // Add a new lesson to the database
    async addLesson(newLesson) {
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLesson),
        });
        const createdLesson = await response.json();
        this.lessons.push(createdLesson);
      } catch (error) {
        console.error('Error adding lesson:', error);
      }
    },

    // Update an existing lesson in the database
    async updateLesson(_id, lesson) {
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lesson),
        });
        const updatedLesson = await response.json();
        console.log(updatedLesson.message);
        this.fetchProducts(); // Refresh lessons
      } catch (error) {
        console.error('Error updating lesson:', error);
      }
    },

    // Delete a lesson from the database
    async deleteLesson(_id) {
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        console.log(result.message);
        this.fetchProducts(); // Refresh lessons
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    },

    // Group cart items by subject
    groupCart() {
      this.groupedCart = this.cart.reduce((groups, lesson) => {
        if (!groups[lesson.subject]) {
          groups[lesson.subject] = {
            ...lesson,
            count: 0, // Initialize count
          };
        }
        groups[lesson.subject].count += 1; // Increment count for this subject
        return groups;
      }, {});
    },

    // Add lesson to the cart
    addToCart(lesson) {
      this.cart.push(lesson); // Add lesson to cart
      this.groupCart(); // Update grouped cart
    },

    // Remove one lesson of a specific subject from the cart
  removeSingleLesson(subject) {
    const index = this.cart.findIndex((lesson) => lesson.subject === subject);
    if (index !== -1) {
      this.cart.splice(index, 1); // Remove one lesson of this subject
      this.groupCart(); // Update grouped cart
    }
    // Automatically return to main page if cart is empty
    if (this.cart.length === 0) {
      this.showCart = false;
    }
  },

  // Remove a specific item from the cart
  removeFromCart(item, index) {
    item.spaces++;
    this.cart.splice(index, 1); // Remove item from the cart
    this.groupCart(); // Update grouped cart

    // Automatically return to main page if cart is empty
    if (this.cart.length === 0) {
      this.showCart = false;
    }
  },

    // Toggle cart visibility
    toggleCart() {
      this.showCart = !this.showCart;
    },

    // Validate the name field
    validateName() {
      const regex = /^[A-Za-z]+$/;
      this.nameError = regex.test(this.name) ? '' : 'Name must contain only letters';
    },

    // Validate the phone field
    validatePhone() {
      const regex = /^[0-9]+$/;
      this.phoneError = regex.test(this.phone) ? '' : 'Phone must contain only numbers';
    },

    // Open the checkout modal
    checkout() {
      this.showModal = true;
    },

    // Close the checkout modal
    closeModal() {
      this.showModal = false;
    },

    // Send the order to the server
    async sendOrder() {
      if (this.isFormValid) {
        const order = {
          name: this.name,
          phone: this.phone,
          items: this.cart.reduce((acc, item) => {
            const existingItem = acc.find((i) => i.lessonId === item._id);
            if (existingItem) {
              existingItem.quantity += 1;
              existingItem.totalPrice += item.price;
            } else {
              acc.push({
                lessonId: item._id,
                subject: item.subject,
                unitPrice: item.price,
                quantity: 1,
                totalPrice: item.price,
              });
            }
            return acc;
          }, []),
          totalAmount: this.cart.reduce((sum, item) => sum + item.price, 0),
          date: new Date().toISOString(),
        };

        try {
          const response = await fetch('https://cw1-backend.onrender.com/Kitten/Orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          });
          const data = await response.json();
          console.log('Order stored successfully:', data);
          this.confirmationMessage = `Order for ${this.name} has been submitted!`;
          this.cart = []; // Clear the cart
          this.name = ''; // Clear the name field
          this.phone = ''; // Clear the phone field
          this.showModal = false; // Close the modal
          this.showCart = false; // Hide the cart
        } catch (error) {
          console.error('Error storing order:', error);
          alert('Failed to store order. Please try again.');
        }
      } else {
        this.nameError = this.name ? '' : 'Name is required';
        this.phoneError = this.phone ? '' : 'Phone number is required';
      }
    },
  },

  // Fetch lessons when the component is mounted
  mounted() {
    this.fetchProducts();
  },
});
