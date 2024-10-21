# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /starter

# Copy package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the current directory contents into the container at /app
COPY . .

# Expose the port that the app runs on
EXPOSE 3000

# Start the Node.js app
CMD ["npm", "start"]