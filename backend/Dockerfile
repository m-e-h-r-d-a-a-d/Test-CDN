FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./cmd/server

FROM alpine:3.19
RUN adduser -D app
USER app
WORKDIR /home/app
COPY --from=builder /app/server ./server
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]

