#include <Arduino.h>

// put function declarations here:
int myFunction(int, int);

void setup() {
  // put your setup code here, to run once:
  int result = myFunction(2, 3);
}

void loop() {
  static int i = 0;
  printf("Hello, World, %d!\n", i);
  delay(1000); // Delay for 1 second (1000 milliseconds)
  i++;
}

// put function definitions here:
int myFunction(int x, int y) {
  return x + y;
}