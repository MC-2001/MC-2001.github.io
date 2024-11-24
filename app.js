new Vue({
  el: '#app', // Binds this Vue instance to the DOM element with id="app"
  data: {
    // Application state variables
    lessons: [],               // Stores the list of lessons fetched from the server
    sortBy: 'subject',         // Default property for sorting lessons (e.g., by subject)
    sortOrder: 'asc',          // Default sort order (ascending)
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
    // Computed properties dynamically update based on data dependencies
    sortedLessons() {
      // Filters lessons based on searchQuery and sorts them
      let filteredLessons = this.lessons.filter((lesson) => {
        return (
          (lesson.subject && lesson.subject.toLowerCase().includes(this.searchQuery.toLowerCase())) || // Matches subject with query
          (lesson.location && lesson.location.toLowerCase().includes(this.searchQuery.toLowerCase())) // Matches location with query
        );
      });

      // Sorts the filtered lessons based on sortBy and sortOrder
      return filteredLessons.sort((a, b) => {
        let modifier = this.sortOrder === 'asc' ? 1 : -1; // Determines sort direction
        if (this.sortBy === 'price' || this.sortBy === 'spaces') {
          // Numeric sorting for 'price' or 'spaces'
          return (a[this.sortBy] - b[this.sortBy]) * modifier;
        } else {
          // String sorting for other fields, handles undefined values gracefully
          let aValue = a[this.sortBy] || '';
          let bValue = b[this.sortBy] || '';
          return aValue.localeCompare(bValue) * modifier;
        }
      });
    },
    isFormValid() {
      // Validates the form by checking if name and phone are valid
      return this.name && !this.nameError && this.phone && !this.phoneError;
    }
  },
  methods: {
    toggleCart() {
      // Toggles the visibility of the shopping cart
      this.showCart = !this.showCart;
    },
    addToCart(lesson) {
      // Adds a lesson to the cart if it has available spaces
      if (lesson.spaces > 0) {
        lesson.spaces--;        // Decrease the number of available spaces
        this.cart.push(lesson); // Add the lesson to the cart
      }
    },
    async fetchProducts() {
      // Fetches the list of lessons from the server
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons'); // API endpoint
        this.lessons = await response.json(); // Update the lessons array with the fetched data
      } catch (error) {
        console.error('Error fetching products:', error); // Log errors in case of failure
      }
    },
    async addLesson(newLesson) {
      // Sends a new lesson to the server and updates the local lessons array
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons', {
          method: 'POST', // HTTP POST request
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLesson), // Send the new lesson data as JSON
        });
        const createdLesson = await response.json(); // Response from the server
        this.lessons.push(createdLesson); // Add the newly created lesson to the list
      } catch (error) {
        console.error('Error adding lesson:', error);
      }
    },
    async updateLesson(_id) {
      // Updates an existing lesson on the server
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'PUT', // HTTP PUT request
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lesson), // Assumes `lesson` is defined elsewhere
        });
        const updatedLesson = await response.json();
        console.log(updatedLesson.message); // Log server's response
        this.fetchProducts(); // Refresh the lessons list
      } catch (error) {
        console.error('Error updating lesson:', error);
      }
    },
    async deleteLesson(_id) {
      // Deletes a lesson from the server
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'DELETE', // HTTP DELETE request
        });
        const result = await response.json(); // Server response
        console.log(result.message); // Log success message
        this.fetchProducts(); // Refresh the lessons list
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    },
    removeFromCart(item, index) {
      // Removes an item from the cart and increases its available spaces
      item.spaces++;               // Increment spaces
      this.cart.splice(index, 1);  // Remove the item from the cart
      if (this.cart.length === 0) {
        this.showCart = false; // Hide the cart if it's empty
      }
    },
    validateName() {
      // Validates that the name contains only letters
      const regex = /^[A-Za-z]+$/;
      this.nameError = regex.test(this.name) ? '' : 'Name must contain only letters';
    },
    validatePhone() {
      // Validates that the phone contains only numbers
      const regex = /^[0-9]+$/;
      this.phoneError = regex.test(this.phone) ? '' : 'Phone must contain only numbers';
    },
    checkout() {
      // Opens the checkout modal
      this.showModal = true;
    },
    closeModal() {
      // Closes the checkout modal
      this.showModal = false;
    },
    sendOrder() {
      // Validates and submits the order
      if (this.isFormValid) {
        this.confirmationMessage = `Order for ${this.name} has been submitted!`; // Confirmation message
        this.cart = [];       // Clear the cart
        this.name = '';       // Reset the name field
        this.phone = '';      // Reset the phone field
        this.showModal = false; // Close the modal
        this.showCart = false; // Hide the cart
      } else {
        // Display validation errors
        this.nameError = this.name ? '' : 'Name is required';
        this.phoneError = this.phone ? '' : 'Phone number is required';
      }
    }
  },
  mounted() {
    // Fetches products when the component is mounted
    this.fetchProducts();
  }
});
