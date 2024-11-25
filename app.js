new Vue({
  el: '#app', // Binds this Vue instance to the DOM element with id="app"
  data: {
    lessons: [],               // Stores the list of lessons fetched from the server
    orders:[],
    sortBy: 'subject',         // Initialize default by subject
    sortOrder: 'asc',          // Initialize default sort order (ascending)
    searchQuery: '',           // Search query entered by the user for filtering lessons
    cart: [],                  // Array to store lessons added to the shopping cart
    showCart: false,           // Controls whether the cart is visible or not
    name: '',                  // User's name for checkout
    phone: '',                 // User's phone number for checkout
    nameError: '',             // Error message for invalid name input
    phoneError: '',            // Error message for invalid phone input
    confirmationMessage: '',   // Message displayed after successfully submitting an order
    showModal: false           // Controls visibility of the modal for checkout
  },
  computed: {
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
    isFormValid() {
      return this.name && !this.nameError && this.phone && !this.phoneError;
    }
  },
  methods: {
    toggleCart() {
      this.showCart = !this.showCart;
    },
    addToCart(lesson) {
      if (lesson.spaces > 0) {
        lesson.spaces--;
        this.cart.push(lesson);
      }
    },
    async fetchProducts() {
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons');
        this.lessons = await response.json();
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    },
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
    async updateLesson(_id, lesson) {
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lesson),
        });
        const updatedLesson = await response.json();
        console.log(updatedLesson.message);
        this.fetchProducts();
      } catch (error) {
        console.error('Error updating lesson:', error);
      }
    },
    async deleteLesson(_id) {
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        console.log(result.message);
        this.fetchProducts();
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    },
    removeFromCart(item, index) {
      item.spaces++;
      this.cart.splice(index, 1);
      if (this.cart.length === 0) {
        this.showCart = false;
      }
    },
    validateName() {
      const regex = /^[A-Za-z]+$/;
      this.nameError = regex.test(this.name) ? '' : 'Name must contain only letters';
    },
    validatePhone() {
      const regex = /^[0-9]+$/;
      this.phoneError = regex.test(this.phone) ? '' : 'Phone must contain only numbers';
    },
    checkout() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    sendOrder() {
      if (this.isFormValid) {
        // Construct the order object
        const order = {
          name: this.name,
          phone: this.phone,
          items: this.cart.reduce((acc, item) => {
            // Check if the item already exists in the order
            const existingItem = acc.find(i => i.lessonId === item._id);
            if (existingItem) {
              // Update quantity and total price for the existing item
              existingItem.quantity += 1;
              existingItem.totalPrice += item.price;
            } else {
              // Add new item to the list
              acc.push({
                lessonId: item._id,  // Use the database ID as lessonId
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
    
        // Send the order to the server
        fetch('https://cw1-backend.onrender.com/Kitten/Orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Order stored successfully:', data);
            this.confirmationMessage = `Order for ${this.name} has been submitted!`;
            this.cart = []; // Clear the cart after successful submission
            this.name = ''; // Clear the name field
            this.phone = ''; // Clear the phone field
            this.showModal = false; // Close the modal
            this.showCart = false; // Hide the cart
          })
          .catch((error) => {
            console.error('Error storing order:', error);
            alert('Failed to store order. Please try again.');
          });
      } else {
        this.nameError = this.name ? '' : 'Name is required';
        this.phoneError = this.phone ? '' : 'Phone number is required';
      }
    },    
  },
  mounted() {
    this.fetchProducts();
  },
});
