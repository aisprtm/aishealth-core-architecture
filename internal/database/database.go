package database

import (
	"fmt"
	"log"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var DB *gorm.DB

// applyToTarget traverses pointers/slices to execute mutation hooks on concrete struct values.
func applyToTarget(val reflect.Value, fn func(reflect.Value)) {
	if !val.IsValid() {
		return
	}

	for val.Kind() == reflect.Ptr || val.Kind() == reflect.Interface {
		if val.IsNil() {
			return
		}
		val = val.Elem()
	}

	switch val.Kind() {
	case reflect.Slice, reflect.Array:
		for i := 0; i < val.Len(); i++ {
			elem := val.Index(i)
			for elem.Kind() == reflect.Ptr || elem.Kind() == reflect.Interface {
				if elem.IsNil() {
					break
				}
				elem = elem.Elem()
			}
			if elem.IsValid() && elem.Kind() == reflect.Struct {
				fn(elem)
			}
		}
	case reflect.Struct:
		fn(val)
	}
}

// RegisterAutoUUIDv7Callback enforces time-sortable 128-bit identifiers before GORM inserts,
// completely eliminating B-Tree index fragmentation under high-throughput writes.
func RegisterAutoUUIDv7Callback(db *gorm.DB) {
	_ = db.Callback().Create().Before("gorm:create").Register("aishealth:auto_uuidv7", func(d *gorm.DB) {
		applyToTarget(d.Statement.ReflectValue, func(v reflect.Value) {
			f := v.FieldByName("ID")
			if f.IsValid() && f.CanSet() && f.Type() == reflect.TypeOf(uuid.UUID{}) {
				if f.Interface().(uuid.UUID) == uuid.Nil {
					newID, err := uuid.NewV7()
					if err != nil {
						_ = d.AddError(fmt.Errorf("FATAL_UUIDV7_GENERATION: %w", err))
						return
					}
					f.Set(reflect.ValueOf(newID))
				}
			}
		})
	})
}

// RegisterAutoAuditCallback dynamically injects authenticated Actor UUIDs (CreatedBy, UpdatedBy)
// directly from the goroutine context into the entity schema without manual controller boilerplate.
func RegisterAutoAuditCallback(db *gorm.DB) {
	extractActorID := func(d *gorm.DB) uuid.UUID {
		if val, ok := d.Get("userID"); ok {
			if uid, valid := val.(uuid.UUID); valid && uid != uuid.Nil {
				return uid
			}
			if str, valid := val.(string); valid {
				if parsed, err := uuid.Parse(str); err == nil && parsed != uuid.Nil {
					return parsed
				}
			}
		}
		if d.Statement.Context != nil {
			if val := d.Statement.Context.Value("userID"); val != nil {
				if uid, valid := val.(uuid.UUID); valid && uid != uuid.Nil {
					return uid
				}
				if str, valid := val.(string); valid {
					if parsed, err := uuid.Parse(str); err == nil && parsed != uuid.Nil {
						return parsed
					}
				}
			}
		}
		return uuid.Nil
	}

	_ = db.Callback().Create().Before("gorm:create").Register("aishealth:auto_audit_create", func(d *gorm.DB) {
		actorID := extractActorID(d)
		if actorID == uuid.Nil {
			return
		}

		actorVal := reflect.ValueOf(actorID)
		applyToTarget(d.Statement.ReflectValue, func(v reflect.Value) {
			createdField := v.FieldByName("CreatedBy")
			if createdField.IsValid() && createdField.CanSet() && createdField.Type() == reflect.TypeOf(uuid.UUID{}) {
				if createdField.Interface().(uuid.UUID) == uuid.Nil {
					createdField.Set(actorVal)
				}
			}

			updatedField := v.FieldByName("UpdatedBy")
			if updatedField.IsValid() && updatedField.CanSet() && updatedField.Type() == reflect.TypeOf(uuid.UUID{}) {
				if updatedField.Interface().(uuid.UUID) == uuid.Nil {
					updatedField.Set(actorVal)
				}
			}
		})
	})

	_ = db.Callback().Update().Before("gorm:update").Register("aishealth:auto_audit_update", func(d *gorm.DB) {
		actorID := extractActorID(d)
		if actorID == uuid.Nil {
			return
		}

		actorVal := reflect.ValueOf(actorID)
		applyToTarget(d.Statement.ReflectValue, func(v reflect.Value) {
			updatedField := v.FieldByName("UpdatedBy")
			if updatedField.IsValid() && updatedField.CanSet() && updatedField.Type() == reflect.TypeOf(uuid.UUID{}) {
				updatedField.Set(actorVal)
			}
		})
	})
}
