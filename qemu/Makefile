# Toolchain configuration
AS = aarch64-linux-gnu-as
LD = aarch64-linux-gnu-ld
CPU = cortex-a57

# Target configuration
TARGET = program
SRC = program.s
OBJ = $(SRC:.s=.o)

# Compilation flags
ASFLAGS = -mcpu=$(CPU)

# Build rules
all: $(TARGET)

$(TARGET): $(OBJ)
	$(LD) $< -o $@

%.o: %.s
	$(AS) $(ASFLAGS) $< -o $@

# Clean rule
clean:
	rm -f $(OBJ) $(TARGET)

.PHONY: all clean