new Vue({
  el: '#app',
  data: {
    lessons: [],
    orders: [],
    sortBy: 'subject',
    sortOrder: 'asc',
    searchQuery: '',
    cart: [],
    showCart: false,
    name: '',
    phone: '',
    nameError: '',
    phoneError: '',
    confirmationMessage: '',
    showModal: false,
    groupedCart: {},
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
    },
  },

  methods: {
    async fetchProducts() {
      try {
        const response = await fetch('https://cw1-backend.onrender.com/Kitten/Lessons');
        this.lessons = await response.json();
      } catch (error) {
        console.error('Error fetching lessons:', error);
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
        await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lesson),
        });
        this.fetchProducts();
      } catch (error) {
        console.error('Error updating lesson:', error);
      }
    },

    async deleteLesson(_id) {
      try {
        await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${_id}`, {
          method: 'DELETE',
        });
        this.fetchProducts();
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    },

    groupCart() {
      this.groupedCart = this.cart.reduce((groups, lesson) => {
        if (!groups[lesson.subject]) {
          groups[lesson.subject] = {
            ...lesson,
            count: 0,
          };
        }
        groups[lesson.subject].count += 1;
        return groups;
      }, {});
    },

    async updateLessonSpaces(lessonId, newSpaces) {
      try {
        await fetch(`https://cw1-backend.onrender.com/Kitten/Lessons/${lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaces: newSpaces }),
        });
      } catch (error) {
        console.error('Error updating lesson spaces:', error);
      }
    },

    addToCart(lesson) {
      if (lesson.spaces > 0) {
        lesson.spaces--;
        this.cart.push({ ...lesson });
        this.groupCart();
      } else {
        alert('No spaces available for this lesson.');
      }
    },

    removeSingleLesson(subject) {
      const index = this.cart.findIndex((lesson) => lesson.subject === subject);
      if (index !== -1) {
        this.cart.splice(index, 1);
        this.groupCart();
      }
      if (this.cart.length === 0) {
        this.showCart = false;
      }
    },

    removeFromCart(item, index) {
      item.spaces++;
      this.cart.splice(index, 1);
      this.groupCart();

      if (this.cart.length === 0) {
        this.showCart = false;
      }
    },

    toggleCart() {
      this.showCart = !this.showCart;
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
        const groupedItems = this.cart.reduce((acc, item) => {
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
        }, []);

        const order = {
          name: this.name,
          phone: this.phone,
          items: groupedItems,
          totalAmount: groupedItems.reduce((sum, item) => sum + item.totalPrice, 0),
          date: new Date().toISOString(),
        };

        fetch('https://cw1-backend.onrender.com/Kitten/Orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Order stored successfully:', data);
            this.confirmationMessage = `Order for ${this.name} has been submitted!`;
            this.cart = [];
            this.name = '';
            this.phone = '';
            this.showModal = false;
            this.showCart = false;
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
