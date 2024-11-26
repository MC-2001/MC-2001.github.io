new Vue({
  el: '#app', // Binds this Vue instance to the DOM element with id="app"
  data: {
    lessons: [],               // Stores the list of lessons fetched from the server
    sortBy: 'subject',         // Initialize default sort criteria to 'subject'
    sortOrder: 'asc',          // Initialize default sort order to ascending
    searchQuery: '',           // Search query entered by the user for filtering lessons//null
    cart: [],                  // Array to store lessons added to the shopping cart
    showCart: false,           // Boolean controlling visibility of the shopping cart
    name: '',                  // User's name for checkout
    phone: '',                 // User's phone number for checkout
    nameError: '',             // Error message for invalid name input
    phoneError: '',            // Error message for invalid phone input
    confirmationMessage: '',   // Message displayed after successfully submitting an order
    showModal: false           // Boolean controlling visibility of the checkout modal
  },
  computed: {
    // Computed property to filter and sort lessons based on the selected criteria
    sortedLessons() {
      let filteredLessons = this.lessons.filter((lesson) => {
        return (
          (lesson.subject && lesson.subject.toLowerCase().includes(this.searchQuery.toLowerCase())) ||  // Filter lessons by subject if it matches search query
          (lesson.location && lesson.location.toLowerCase().includes(this.searchQuery.toLowerCase()))    // Filter lessons by location if it matches search query
        );
      });

      return filteredLessons.sort((a, b) => {
        let modifier = this.sortOrder === 'asc' ? 1 : -1;  // Determine the order of sorting (ascending or descending)
        
        // Sort based on the chosen field (either 'price' or 'spaces' or 'subject' etc.)
        if (this.sortBy === 'price' || this.sortBy === 'spaces') {
          return (a[this.sortBy] - b[this.sortBy]) * modifier;  // Numerical comparison (ascending/descending)
        } else {
          // For string fields (e.g., 'subject', 'location') compare lexicographically
          let aValue = a[this.sortBy] || '';  // Handle null or undefined by defaulting to an empty string
          let bValue = b[this.sortBy] || '';
          return aValue.localeCompare(bValue) * modifier;  // Perform locale-sensitive comparison for strings
        }
      });
    },
    
    // Computed property to check if the form is valid for checkout
    isFormValid() {
      return this.name && !this.nameError && this.phone && !this.phoneError;  // Valid if both name and phone are provided, and there are no errors
    }
  },
  methods: {
    // Toggles the visibility of the cart
    toggleCart() {
      this.showCart = !this.showCart;
    },
    
    // Adds a lesson to the cart (if it has available spaces)
    addToCart(lesson) {
      if (lesson.spaces > 0) {
        lesson.spaces--;  // Decrease spaces for the lesson as it's added to the cart
        this.cart.push(lesson);  // Add the lesson to the cart
      }
    },

    // Fetches the list of lessons from the server to display on frt-end//GET
    async fetchProducts() {
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons');  // Fetch lessons from the API
        this.lessons = await response.json();  // Parse the response as JSON and store it in `lessons`
      } catch (error) {
        console.error('Error fetching products:', error);  // Log errors if fetching fails
      }
    },

    // Adds a new lesson to the server and updates the `lessons` list on frt-end //POST
    async addLesson(newLesson) {
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLesson),  // Send the new lesson data as JSON
        });
        const createdLesson = await response.json();  // Parse the response JSON
        this.lessons.push(createdLesson);  // Add the newly created lesson to the `lessons` array
      } catch (error) {
        console.error('Error adding lesson:', error);  // Log errors if adding the lesson fails
      }
    },

    // Updates an existing lesson on the server //PUT
    async updateLesson(_id, lesson) {
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lesson),  // Send the updated lesson data as JSON
        });
        const updatedLesson = await response.json();  // Parse the response as JSON
        console.log(updatedLesson.message);  // Log the response message (if any)
        this.fetchProducts();  // Refresh the list of lessons from the server
      } catch (error) {
        console.error('Error updating lesson:', error);  // Log errors if updating the lesson fails
      }
    },

    // Deletes a lesson from the server //DELETE  
    async deleteLesson(_id) {
      try {
        const response = await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'DELETE',  // Use DELETE method to remove the lesson
        });
        const result = await response.json();  // Parse the response as JSON
        console.log(result.message);  // Log the result message
        this.fetchProducts();  // Refresh the list of lessons from the server
      } catch (error) {
        console.error('Error deleting lesson:', error);  // Log errors if deleting the lesson fails
      }
    },

    // Removes a lesson from the cart and increases available spaces for that lesson
    removeFromCart(item, index) {
      item.spaces++;  // Increase spaces for the lesson since it's removed from the cart
      this.cart.splice(index, 1);  // Remove the lesson from the cart array
      if (this.cart.length === 0) {
        this.showCart = false;  // Hide the cart if it's empty
      }
    },

    // Validates the user's name input using a regular expression
    validateName() {
      const regex = /^[A-Za-z]+$/;  // Regular expression to check if the name contains only letters
      this.nameError = regex.test(this.name) ? '' : 'Name must contain only letters';  // Set an error message if validation fails
    },

    // Validates the user's phone number input using a regular expression
    validatePhone() {
      const regex = /^[0-9]+$/;  // Regular expression to check if the phone number contains only digits
      this.phoneError = regex.test(this.phone) ? '' : 'Phone must contain only numbers';  // Set an error message if validation fails
    },

    // Opens the checkout modal
    checkout() {
      this.showModal = true;
    },

    // Closes the checkout modal
    closeModal() {
      this.showModal = false;
    },

    // Sends the order to the server
    sendOrder() {
      if (this.isFormValid) {
        const order = {
          name: this.name,
          phone: this.phone,
          items: this.cart.map((item) => ({
            lessonId: item._id,  // Use the database ID as lessonId
            price: item.price || 0,  // Ensure price has a default value
            subject: item.subject,
            spaces: item.spaces,
          })),

          total: this.cart[0].price || 0,  // Price of the first lesson (if exists)
          date: new Date().toISOString(),  // Store the current date in ISO format
        };
    
        console.log('Order being sent:', order);  // Debugging log for the order being sent
    
        fetch('https://cw1-backend.onrender.com/Kitten/Orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),  // Send the order data as JSON to the server
        })
          .then((response) => response.json())  // Parse the response from the server
          .then((data) => {
            console.log('Order stored successfully:', data);  // Log the successful order submission
            this.confirmationMessage = `Order for ${this.name} has been submitted!`;  // Set confirmation message
            this.cart = [];  // Empty the cart
            this.name = '';  // Clear name field
            this.phone = '';  // Clear phone field
            this.showModal = false;  // Close the checkout modal
            this.showCart = false;  // Hide the cart
          })
          .catch((error) => {
            console.error('Error storing order:', error);  // Log errors if order submission fails
            alert('Failed to store order. Please try again.');  // Show an error alert
          });
      } else {
        this.nameError = this.name ? '' : 'Name is required';  // Set error if name is missing
        this.phoneError = this.phone ? '' : 'Phone number is required';  // Set error if phone number is missing
      }
    }
  },
  mounted() {
    this.fetchProducts();  // Fetch the lessons when the component is mounted (page load)
  },
}); 
